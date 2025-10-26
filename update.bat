@echo off
echo Updating repository...
git pull

echo.
echo Installing dependencies...
yarn install

echo.
echo Building extension...
yarn build

echo.
echo Done! Extension is ready in the dist folder.
pause
