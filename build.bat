@echo off

echo ======================================
echo   COMPILANDO CATALOGO MI MAYO
echo ======================================
cd /d "%~dp0"

rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul

venv\Scripts\python.exe -m PyInstaller ^
--clean ^
--onefile ^
--windowed ^
--name "CatalogoMiMayo" ^
--icon "logo.ico" ^
app/main.py

venv\Scripts\python.exe -m PyInstaller ^
--clean ^
--onefile ^
--windowed ^
--name "AsistenteImagenes" ^
--icon "logo.ico" ^
scripts/asistente_imagenes.py

echo.
echo ======================================
echo Compilacion finalizada
echo ======================================
echo.
echo Copiando recursos...

xcopy data dist\data /E /I /Y
xcopy img dist\img /E /I /Y

if exist .env copy .env dist\

copy dist\CatalogoMiMayo.exe . /Y
copy dist\AsistenteImagenes.exe . /Y

del /q *.spec 2>nul
pause