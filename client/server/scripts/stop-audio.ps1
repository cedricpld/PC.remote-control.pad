# On recherche tous les processus PowerShell dont la ligne de commande contient "play-audio.ps1"
# Cela nous permet de cibler uniquement les scripts qui jouent de la musique.
$audioProcesses = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%play-audio.ps1%' AND Name = 'powershell.exe'"

if ($null -ne $audioProcesses) {
    # Si on trouve un ou plusieurs processus audio...
    
    # On récupère leur ID de processus (PID)
    $pidsToStop = $audioProcesses.ProcessId
    
    # On arrête les processus en utilisant leur PID. C'est la méthode la plus fiable.
    Stop-Process -Id $pidsToStop -Force
    
    # On renvoie un message de succès.
    Write-Host "Audio en cours de lecture arrêté avec succès."
    exit 0
} else {
    # Si aucun processus n'est trouvé, on l'indique et on quitte proprement.
    Write-Host "Aucun son en cours de lecture trouvé."
    exit 0
}