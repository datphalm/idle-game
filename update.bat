@echo off
chcp 65001 > nul
echo ==========================================
echo    IDLE RPG - AUTO BUILD & GIT PUBLISH
echo ==========================================
echo.
set /p MSG="Nhập nội dung cập nhật (hoặc ấn Enter để dùng mặc định): "
if "%MSG%"=="" set MSG=Update game release
python tools\publish.py %MSG%
echo.
pause
