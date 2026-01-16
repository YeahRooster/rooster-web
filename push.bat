@echo off
echo ========================================
echo   SUBIENDO CAMBIOS A ROOSTER ONLINE...
echo ========================================
git add .
git commit -m "Migracion Final: Supabase + Cloudinary + Mejoras de Velocidad"
git push origin main
echo ========================================
echo   PROCESO TERMINADO! (Vercel se actualizara en 1 min)
echo ========================================
pause
