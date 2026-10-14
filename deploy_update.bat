@echo off
chcp 65001 >nul
cls
echo ================================================================
echo       IDLE RPG - ĐẨY BẢN CẬP NHẬT LÊN GITHUB & MÁY CHỦ CLOUD
echo ================================================================
echo.
echo [CHÚ Ý]: Hãy chắc chắn bạn ĐÃ MỞ GAME VÀ TEST KỸ TRÊN MÁY xong rồi!
echo          Nếu chưa test hoặc game còn lỗi, hãy gõ N để hủy.
echo.
set /p confirm="Bạn có chắc chắn muốn đóng gói và đẩy bản cập nhật lên không? (Gõ Y để tiếp tục, phím khác để hủy): "
if /i "%confirm%" NEQ "Y" (
    echo.
    echo ❌ Đã hủy thao tác. Game KHÔNG bị đẩy lên máy chủ.
    echo Bạn có thể tiếp tục chỉnh sửa và test trên máy bình thường.
    echo.
    pause
    exit /b 0
)

echo.
echo ================================================================
echo [1/3] Đang đóng gói mã nguồn và tạo bản vá bảo vệ (Hot-Patch)...
python tools/obfuscator.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Có lỗi xảy ra trong quá trình đóng gói. Vui lòng kiểm tra lại.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Đang nén file zip phân phối bản mới nhất (IdleRPG_Online_Latest.zip)...
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'IdleRPG_Online_Latest.zip' -Force; Copy-Item 'IdleRPG_Online_Latest.zip' '..\IdleRPG_Online_Latest.zip' -Force"

echo.
echo [3/3] Đang đẩy bản cập nhật lên GitHub và máy chủ Render...
git add .
git commit -m "Cập nhật tính năng và sửa lỗi game mới (Đã test OK trên máy)"
git push origin main

echo.
echo ================================================================
echo   CHUC MUNG! BAN CAP NHAT DA DUOC DAY LEN CLOUD THANH CONG!
echo ================================================================
echo.
echo - Render se tu dong cap nhat trong vong 30 giay.
echo - Tat ca ban be dang choi chi can mo lai IdleRPG.exe,
echo   game se TU DONG TAI BAN MOI ma KHONG CAN tai lai zip!
echo.
pause
