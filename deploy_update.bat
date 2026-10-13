@echo off
chcp 65001 >nul
cls
echo ================================================================
echo   IDLE RPG - ONE-CLICK AUTO-UPDATE CLOUD DEPLOYMENT
echo ================================================================
echo.
echo [1/3] Dang dong goi ma nguon va tao ban va bao ve (Hot-Patch)...
python tools/obfuscator.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Co loi xay ra trong qua trinh dong goi. Vui long kiem tra lai.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Dang nen file zip phan phoi du phong...
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'IdleRPG_Online_v2.2.0.zip' -Force"

echo.
echo [3/3] Dang day ban cap nhat len GitHub va may chu Render...
git add .
git commit -m "Ban cap nhat game moi (Hot-Patch and Auto-Sync)"
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
