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

venv\Scripts\python.exe -m PyInstaller ^
--clean ^
--onefile ^
--windowed ^
--name "NormalizadorImagenes" ^
--icon "logo.ico" ^
--collect-all rembg ^
--copy-metadata pymatting ^
scripts/normalizar_imagenes.py

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
copy dist\NormalizadorImagenes.exe . /Y

del /q *.spec 2>nul

echo.
echo ======================================
echo   EJECUTABLES GENERADOS
echo ======================================
echo.
echo CatalogoMiMayo.exe
echo AsistenteImagenes.exe
echo NormalizadorImagenes.exe
echo.

pause