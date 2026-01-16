@echo off
title ROOSTER - SUBIDA TOTAL A VERCEL
echo ========================================
echo   🚀 PREPARANDO SUBIDA TOTAL A LA NUBE
echo ========================================
echo.
echo [1/3] Guardando cambios locales...
git add .
echo.
echo [2/3] Etiquetando actualizacion...
git commit -m "Sincronizacion Total: Galeria Social + Config de Imagenes"
echo.
echo [3/3] Subiendo a GitHub/Vercel...
git push origin main
echo.
echo ========================================
echo   ✅ ¡TODO LISTO! 
echo   Vercel estara actualizado en 1-2 min.
echo ========================================
echo.
pause
