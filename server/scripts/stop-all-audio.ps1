# Commande pour trouver et arrêter tous les processus PowerShell qui exécutent le script "play-audio.ps1"
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*play-audio.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
