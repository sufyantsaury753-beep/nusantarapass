@echo off
title NusantaraPass Local Server
echo ==================================================
echo   NUSANTARAPASS — LOCALHOST WEB SERVER (PORT 8080)
echo ==================================================
echo.
echo Server aktif di: http://localhost:8080
echo Jendela ini jangan ditutup selama sedang membuka website.
echo Tekan Ctrl + C untuk mematikan server.
echo.
start http://localhost:8080
python -m http.server 8080
pause
