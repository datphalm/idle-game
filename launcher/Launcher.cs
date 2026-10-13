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

                    // 2. Tìm cổng mạng khả dụng
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

                // Thêm Security Headers
                res.Headers.Add("X-Content-Type-Options", "nosniff");
                res.Headers.Add("X-Frame-Options", "SAMEORIGIN");
                res.Headers.Add("Access-Control-Allow-Origin", "*");

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    res.ContentType = GetMimeType(Path.GetExtension(filePath));
                    res.ContentLength64 = bytes.Length;
                    res.OutputStream.Write(bytes, 0, bytes.Length);
                    res.StatusCode = 200;
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
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".mp3": return "audio/mpeg";
                case ".wav": return "audio/wav";
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
    }
}
