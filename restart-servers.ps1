# OpenRoadMap - Restart Script
$host.UI.RawUI.WindowTitle = "OpenRoadMap - Restarting Servers"

Write-Host ""
Write-Host "Restarting OpenRoadMap servers..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Done. Run START.bat to start servers."
