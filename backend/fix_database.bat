@echo off
echo Stopping all Node.js processes to unlock files...
taskkill /F /IM node.exe
echo.
echo Updating Database Schema...
call npx prisma db push
echo.
echo Database update complete.
echo.
echo Please restart your servers now:
echo 1. Open a terminal for Frontend and run: npm run dev
echo 2. Open a terminal for Backend and run: npm run dev
echo.
pause
