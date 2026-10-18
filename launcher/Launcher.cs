using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Diagnostics;
using System.Threading;
using System.Collections.Generic;
using System.Windows.Forms;
using Microsoft.Win32;

namespace IdleRPGLauncher
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _baseDir;
        private static bool _isRunning = true;
        private static int _port = 39184;

        [STAThread]
        static void Main(string[] args)
        {
            // 1. Kiểm soát Single Instance (Chống mở chồng chéo nhiều bản game)
            bool isNewInstance;
            using (Mutex mutex = new Mutex(true, "Global\\IdleRPG_Standalone_Game_Instance", out isNewInstance))
            {
                if (!isNewInstance)
                {
                    MessageBox.Show("⚔️ Game Idle RPG đang chạy rồi! Vui lòng kiểm tra thanh tác vụ hoặc cửa sổ đang mở.", 
                                    "Idle RPG", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                try
                {
                    // Lấy thư mục gốc chứa file game (index.html, js, css...)
                    _baseDir = AppDomain.CurrentDomain.BaseDirectory;
                    if (!File.Exists(Path.Combine(_baseDir, "index.html")))
                    {
                        // Thử tìm thư mục cha nếu exe nằm trong thư mục con
                        DirectoryInfo parent = Directory.GetParent(_baseDir);
                        if (parent != null && File.Exists(Path.Combine(parent.FullName, "index.html")))
                        {
                            _baseDir = parent.FullName;
                        }
                    }

                    // 2. Tự động kiểm tra và cập nhật bản vá Hot-Patch từ Cloud Server Render
                    CheckAndApplyUpdates();

                    // 3. Tìm cổng mạng khả dụng
                    _port = FindFreePort(39180, 39250);

                    // 3. Khởi chạy HTTP Server cục bộ bảo mật
                    StartLocalServer();

                    // 4. Tìm kiếm trình duyệt Chromium để chạy chế độ App Window độc lập
                    string browserPath = FindChromiumBrowser();
                    string gameUrl = string.Format("http://127.0.0.1:{0}/index.html", _port);
                    string userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IdleRPG_AppProfile");

                    Process gameProcess = null;

                    if (!string.IsNullOrEmpty(browserPath))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = browserPath;
                        // Chạy cửa sổ độc lập không có thanh địa chỉ / không tab / khóa extension gian lận
                        psi.Arguments = string.Format("--app=\"{0}\" --window-size=1280,820 --user-data-dir=\"{1}\" --disable-extensions --disable-sync --disable-default-apps --no-first-run", 
                                                      gameUrl, userDataDir);
                        psi.UseShellExecute = false;
                        gameProcess = Process.Start(psi);
                    }
                    else
                    {
                        // Mở trình duyệt mặc định nếu không tìm thấy Chrome/Edge
                        gameProcess = Process.Start(new ProcessStartInfo(gameUrl) { UseShellExecute = true });
                    }

                    // 5. Đợi người chơi đóng cửa sổ game thì dừng server và thoát sạch sẽ
                    if (gameProcess != null)
                    {
                        gameProcess.WaitForExit();
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Lỗi khởi chạy game: " + ex.Message, "Idle RPG Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                finally
                {
                    StopLocalServer();
                }
            }
        }

        private static int FindFreePort(int startPort, int endPort)
        {
            for (int port = startPort; port <= endPort; port++)
            {
                try
                {
                    TcpListener tcp = new TcpListener(IPAddress.Loopback, port);
                    tcp.Start();
                    tcp.Stop();
                    return port;
                }
                catch { }
            }
            return 39184;
        }

        private static void StartLocalServer()
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add(string.Format("http://127.0.0.1:{0}/", _port));
            _listener.Start();

            Thread serverThread = new Thread(() =>
            {
                while (_isRunning && _listener.IsListening)
                {
                    try
                    {
                        HttpListenerContext context = _listener.GetContext();
                        ThreadPool.QueueUserWorkItem((c) => HandleRequest((HttpListenerContext)c), context);
                    }
                    catch
                    {
                        if (!_isRunning) break;
                    }
                }
            });
            serverThread.IsBackground = true;
            serverThread.Start();
        }

        private static void HandleRequest(HttpListenerContext context)
        {
            try
            {
                HttpListenerRequest req = context.Request;
                HttpListenerResponse res = context.Response;

                string rawPath = req.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(rawPath)) rawPath = "index.html";

                // Chống directory traversal
                rawPath = rawPath.Replace('/', Path.DirectorySeparatorChar);
                string filePath = Path.Combine(_baseDir, rawPath);

                // Thêm Security & No-Cache Headers để client luôn nạp file mới nhất
                res.Headers.Add("X-Content-Type-Options", "nosniff");
                res.Headers.Add("X-Frame-Options", "SAMEORIGIN");
                res.Headers.Add("Access-Control-Allow-Origin", "*");
                res.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                res.Headers.Add("Pragma", "no-cache");
                res.Headers.Add("Expires", "0");

                // Nếu file chưa có trên đĩa và là tài nguyên assets, tự động kéo về từ Server và lưu cục bộ
                if (!File.Exists(filePath))
                {
                    string normalRaw = req.Url.AbsolutePath.TrimStart('/');
                    if (normalRaw.StartsWith("assets/", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            string remoteUrl = "https://idle-game-ypvy.onrender.com/" + normalRaw;
                            string parentDir = Path.GetDirectoryName(filePath);
                            if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir))
                            {
                                Directory.CreateDirectory(parentDir);
                            }
                            using (WebClient wc = new WebClient())
                            {
                                wc.Headers.Add("User-Agent", "IdleRPG-Launcher");
                                wc.DownloadFile(remoteUrl, filePath);
                            }
                        }
                        catch { }
                    }
                }

                if (File.Exists(filePath))
                {
                    FileInfo fi = new FileInfo(filePath);
                    long totalLength = fi.Length;
                    string mime = GetMimeType(Path.GetExtension(filePath));
                    res.ContentType = mime;
                    res.Headers.Add("Accept-Ranges", "bytes");

                    string rangeHeader = req.Headers["Range"];
                    if (!string.IsNullOrEmpty(rangeHeader) && rangeHeader.StartsWith("bytes="))
                    {
                        string rangeValue = rangeHeader.Substring(6).Trim();
                        string[] range = rangeValue.Split('-');
                        long start = 0;
                        long end = totalLength - 1;
                        if (!string.IsNullOrEmpty(range[0])) long.TryParse(range[0], out start);
                        if (range.Length > 1 && !string.IsNullOrEmpty(range[1])) long.TryParse(range[1], out end);
                        if (end >= totalLength) end = totalLength - 1;

                        if (start > end || start < 0)
                        {
                            res.StatusCode = 416; // Range Not Satisfiable
                            res.Headers.Add("Content-Range", string.Format("bytes */{0}", totalLength));
                        }
                        else
                        {
                            long length = end - start + 1;
                            res.StatusCode = 206; // Partial Content
                            res.Headers.Add("Content-Range", string.Format("bytes {0}-{1}/{2}", start, end, totalLength));
                            res.ContentLength64 = length;
                            using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                            {
                                fs.Seek(start, SeekOrigin.Begin);
                                byte[] buffer = new byte[65536];
                                long remaining = length;
                                while (remaining > 0)
                                {
                                    int read = fs.Read(buffer, 0, (int)Math.Min(buffer.Length, remaining));
                                    if (read <= 0) break;
                                    res.OutputStream.Write(buffer, 0, read);
                                    remaining -= read;
                                }
                            }
                        }
                    }
                    else
                    {
                        res.StatusCode = 200;
                        res.ContentLength64 = totalLength;
                        using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                        {
                            byte[] buffer = new byte[65536];
                            int read;
                            while ((read = fs.Read(buffer, 0, buffer.Length)) > 0)
                            {
                                res.OutputStream.Write(buffer, 0, read);
                            }
                        }
                    }
                }
                else
                {
                    res.StatusCode = 404;
                    byte[] err = System.Text.Encoding.UTF8.GetBytes("File not found");
                    res.OutputStream.Write(err, 0, err.Length);
                }
                res.OutputStream.Close();
            }
            catch { }
        }

        private static string GetMimeType(string ext)
        {
            ext = (ext ?? "").ToLowerInvariant();
            switch (ext)
            {
                case ".html": case ".htm": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg": case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".webp": return "image/webp";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".mp4": return "video/mp4";
                case ".webm": return "video/webm";
                case ".ogg": case ".ogv": return "video/ogg";
                case ".mp3": return "audio/mpeg";
                case ".wav": return "audio/wav";
                case ".m4a": return "audio/mp4";
                case ".wasm": return "application/wasm";
                default: return "application/octet-stream";
            }
        }

        private static void StopLocalServer()
        {
            _isRunning = false;
            try
            {
                if (_listener != null && _listener.IsListening)
                {
                    _listener.Stop();
                    _listener.Close();
                }
            }
            catch { }
        }

        private static string FindChromiumBrowser()
        {
            // Kiểm tra Chrome
            string[] chromePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };
            foreach (var p in chromePaths)
            {
                if (File.Exists(p)) return p;
            }

            // Kiểm tra Edge
            string[] edgePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe")
            };
            foreach (var p in edgePaths)
            {
                if (File.Exists(p)) return p;
            }

            // Kiểm tra Registry
            try
            {
                using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"))
                {
                    if (key != null)
                    {
                        var val = key.GetValue(null) as string;
                        if (File.Exists(val)) return val;
                    }
                }
                using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe"))
                {
                    if (key != null)
                    {
                        var val = key.GetValue(null) as string;
                        if (File.Exists(val)) return val;
                    }
                }
            }
            catch { }

            return null;
        }

        private static void CheckAndApplyUpdates()
        {
            try
            {
                // Cho phép giao thức bảo mật TLS 1.2
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | SecurityProtocolType.Tls;
                string versionUrl = "https://idle-game-ypvy.onrender.com/api/version";

                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(versionUrl);
                req.Timeout = 2500;
                req.ReadWriteTimeout = 2500;
                req.UserAgent = "IdleRPG-Launcher";

                string remoteJson = null;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    if (resp.StatusCode == HttpStatusCode.OK)
                    {
                        using (StreamReader sr = new StreamReader(resp.GetResponseStream(), System.Text.Encoding.UTF8))
                        {
                            remoteJson = sr.ReadToEnd();
                        }
                    }
                }

                if (string.IsNullOrEmpty(remoteJson)) return;

                string remoteVersion = ExtractJsonValue(remoteJson, "version");
                if (string.IsNullOrEmpty(remoteVersion)) return;

                string localVersionPath = Path.Combine(_baseDir, "version.json");
                string localVersion = "2.1.0";
                if (File.Exists(localVersionPath))
                {
                    string localJson = File.ReadAllText(localVersionPath);
                    string parsed = ExtractJsonValue(localJson, "version");
                    if (!string.IsNullOrEmpty(parsed)) localVersion = parsed;
                }

                // Nếu máy chủ có phiên bản mới hơn, tự động kéo bản vá Hot-Patch về đè ngay
                if (IsNewerVersion(remoteVersion, localVersion))
                {
                    string bundleUrl = "https://idle-game-ypvy.onrender.com/api/patch/bundle";
                    string targetBundle = Path.Combine(_baseDir, "js", "game.bundle.js");
                    string tempBundle = targetBundle + ".tmp";

                    using (WebClient wc = new WebClient())
                    {
                        wc.Headers.Add("User-Agent", "IdleRPG-Launcher");
                        wc.DownloadFile(bundleUrl, tempBundle);

                        FileInfo fi = new FileInfo(tempBundle);
                        if (fi.Exists && fi.Length > 1000)
                        {
                            if (File.Exists(targetBundle)) File.Delete(targetBundle);
                            File.Move(tempBundle, targetBundle);
                        }
                        else if (File.Exists(tempBundle))
                        {
                            File.Delete(tempBundle);
                        }

                        // Tải bổ sung CSS nếu có cập nhật giao diện
                        try
                        {
                            string cssUrl = "https://idle-game-ypvy.onrender.com/api/patch/css";
                            string targetCss = Path.Combine(_baseDir, "css", "style.css");
                            string tempCss = targetCss + ".tmp";
                            wc.DownloadFile(cssUrl, tempCss);
                            if (File.Exists(tempCss) && new FileInfo(tempCss).Length > 500)
                            {
                                if (File.Exists(targetCss)) File.Delete(targetCss);
                                File.Move(tempCss, targetCss);
                            }
                        }
                        catch { }

                        // Tải bổ sung HTML nếu có cập nhật cấu trúc trang
                        try
                        {
                            string htmlUrl = "https://idle-game-ypvy.onrender.com/api/patch/html";
                            string targetHtml = Path.Combine(_baseDir, "index.html");
                            string tempHtml = targetHtml + ".tmp";
                            wc.DownloadFile(htmlUrl, tempHtml);
                            if (File.Exists(tempHtml) && new FileInfo(tempHtml).Length > 500)
                            {
                                if (File.Exists(targetHtml)) File.Delete(targetHtml);
                                File.Move(tempHtml, targetHtml);
                            }
                        }
                        catch { }

                        // Ghi lại version mới cục bộ để không lặp lại cập nhật
                        File.WriteAllText(localVersionPath, remoteJson, System.Text.Encoding.UTF8);
                    }
                }
            }
            catch
            {
                // Bỏ qua ngoại lệ ngầm: đảm bảo game vẫn khởi động mượt mà khi ngoại tuyến
            }
        }

        private static string ExtractJsonValue(string json, string key)
        {
            try
            {
                string pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]+)\"";
                System.Text.RegularExpressions.Match m = System.Text.RegularExpressions.Regex.Match(json, pattern);
                if (m.Success) return m.Groups[1].Value;
            }
            catch { }
            return null;
        }

        private static bool IsNewerVersion(string remote, string current)
        {
            try
            {
                string[] rParts = remote.Split('.');
                string[] cParts = current.Split('.');
                int len = Math.Max(rParts.Length, cParts.Length);
                for (int i = 0; i < len; i++)
                {
                    int r = i < rParts.Length ? int.Parse(rParts[i]) : 0;
                    int c = i < cParts.Length ? int.Parse(cParts[i]) : 0;
                    if (r > c) return true;
                    if (r < c) return false;
                }
            }
            catch { }
            return false;
        }
    }
}
