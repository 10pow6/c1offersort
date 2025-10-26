@echo off
echo Updating repository...
git pull

echo.
echo Installing dependencies and building...
yarn install && yarn build