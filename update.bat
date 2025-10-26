@echo off
echo Updating repository...
git pull

echo.
echo Installing dependencies...
npm install

echo.
echo Building extension...
npm run build

echo.
echo Done! Extension is ready in the dist folder.
pause
