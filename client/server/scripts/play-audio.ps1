param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

# Vérifie si le fichier spécifié existe réellement
if (-not (Test-Path -Path $FilePath -PathType Leaf)) {
    Write-Error "Fichier audio non trouvé sur le chemin : $FilePath"
    exit 1
}

try {
    # Ajoute les librairies .NET nécessaires pour le lecteur audio
    Add-Type -AssemblyName PresentationCore

    # Crée un nouvel objet lecteur multimédia
    $player = New-Object System.Windows.Media.MediaPlayer

    # Ouvre le fichier audio en créant un URI (Uniform Resource Identifier)
    $player.Open([System.Uri]$FilePath)

    # Lance la lecture
    $player.Play()

    # Attend brièvement pour s'assurer que la lecture a bien démarré
    Start-Sleep -Milliseconds 200

    # Boucle de surveillance : tant que la lecture n'est pas terminée
    # CORRECTION : On compare $player.Position avec $player.NaturalDuration.TimeSpan
    while ($player.Position -lt $player.NaturalDuration.TimeSpan) {
        # Petite pause pour ne pas surcharger le CPU
        Start-Sleep -Milliseconds 100
    }

} catch {
    # En cas d'erreur, on la signale proprement
    Write-Error "Une erreur est survenue lors de la lecture du fichier audio : $($_.Exception.Message)"
    exit 1
}