@echo off
chcp 65001 >nul
cls
echo ================================================================
echo   ⚔️  IDLE RPG - ONE-CLICK AUTO-UPDATE & CLOUD DEPLOYMENT
echo ================================================================
echo.
echo [1/3] Đang đóng gói mã nguồn và tạo bản vá bảo vệ (Hot-Patch)...
python tools/obfuscator.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Có lỗi xảy ra trong quá trình đóng gói. Vui lòng kiểm tra lại.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Đang nén file zip phân phối dự phòng IdleRPG_Online_v2.1.0.zip...
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'IdleRPG_Online_v2.1.0.zip' -Force"

echo.
echo [3/3] Đang đẩy bản cập nhật lên GitHub và máy chủ đám mây Render...
git add .
git commit -m "Bản cập nhật game mới (Hot-Patch & Auto-Sync)"
git push origin main

echo.
echo ================================================================
echo  ✨ CHÚC MỪNG! BẢN CẬP NHẬT ĐÃ ĐƯỢC ĐẨY LÊN CLOUD THÀNH CÔNG!
echo ================================================================
echo.
echo 👉 Render sẽ tự động cập nhật trong vòng 30 giây.
echo 👉 Tất cả bạn bè đang chơi chỉ cần mở lại 'IdleRPG.exe', 
echo    game sẽ TỰ ĐỘNG TẢI BẢN MỚI trong 1 giây mà KHÔNG CẦN tải lại zip!
echo.
pause
