# Attendre 10 secondes
Start-Sleep -Seconds 3

# Chemin vers votre script principal pour lancer le serveur
Start-Process -FilePath "cmd.exe" -ArgumentList "/c CONTROL-PAD.bat" -WindowStyle Hidden
