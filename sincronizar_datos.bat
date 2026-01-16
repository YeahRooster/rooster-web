@echo off
title Sincronizador Rooster - Google Sheets a Supabase
echo 🚀 Iniciando sincronizacion de datos...
echo.

cd /d "%~dp0"
node scripts/migrate.js

echo.
echo ===========================================
echo ✅ Sincronizacion Finalizada. 
echo Puedes cerrar esta ventana.
echo ===========================================
pause
