# simulate-shortcut.ps1
# Prend un raccourci clavier en argument (ex: "Win+D", "Ctrl+Shift+S", "F5")
# Utilise System.Windows.Forms.SendKeys pour simuler les frappes.
# Exécution : powershell.exe -ExecutionPolicy Bypass -File "chemin\vers\simulate-shortcut.ps1" -Shortcut "Win+D"

param (
    [string]$Shortcut
)

# Assurez-vous que l'assembly System.Windows.Forms est chargé
try {
    Add-Type -AssemblyName System.Windows.Forms
} catch {
    Write-Error "Impossible de charger System.Windows.Forms. Verifiez l'environnement PowerShell."
    exit 1
}

# Fonction pour simuler le raccourci via SendKeys
function Simulate-Keys {
    param (
        [string]$Keys
    )
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
}

# --- NOUVELLE LOGIQUE DE TRADUCTION PLUS ROBUSTE ---

# Initialisation des modificateurs et de la touche finale pour SendKeys
$sendKeysModifiers = ""
$finalKey = $Shortcut.Trim() # Commencer avec le raccourci complet et nettoyer les espaces

# Détecter et construire la chaîne des modificateurs. L'ordre des IF est important.
if ($finalKey -match '(?i)Ctrl\+') {
    $sendKeysModifiers += "^" # ^ pour Ctrl
    $finalKey = $finalKey -replace '(?i)Ctrl\+', ''
}
if ($finalKey -match '(?i)Alt\+') {
    $sendKeysModifiers += "%" # % pour Alt
    $finalKey = $finalKey -replace '(?i)Alt\+', ''
}
if ($finalKey -match '(?i)Win\+|(?i)Windows\+') {
    $sendKeysModifiers += "#" # # pour Win (Windows Key)
    $finalKey = $finalKey -replace '(?i)Win\+|(?i)Windows\+', ''
}
if ($finalKey -match '(?i)Shift\+') {
    $sendKeysModifiers += "+" # + pour Shift
    $finalKey = $finalKey -replace '(?i)Shift\+', ''
}

# Nettoyer les espaces résiduels après la suppression des modificateurs
$finalKey = $finalKey.Trim()

# Remplacements pour les touches spéciales qui ont besoin de {} dans SendKeys
# Les SendKeys sont souvent insensibles à la casse pour les lettres simples.
$specialKeyMappings = @{
    "enter" = "{ENTER}"; "tab" = "{TAB}"; "escape" = "{ESC}"; "space" = "{SPACE}";
    "backspace" = "{BS}"; "delete" = "{DEL}"; "printscreen" = "{PRTSC}"; "pause" = "{BREAK}";
    "up" = "{UP}"; "down" = "{DOWN}"; "left" = "{LEFT}"; "right" = "{RIGHT}";
    "home" = "{HOME}"; "end" = "{END}"; "pageup" = "{PGUP}"; "pagedown" = "{PGDN}";
    "capslock" = "{CAPSLOCK}"; "numlock" = "{NUMLOCK}"; "scrolllock" = "{SCROLLLOCK}";
    "insert" = "{INSERT}";
    "menu" = "{APPSKEY}"; # Touche de menu contextuel (touche Applications)
    # Ajouter d'autres touches spéciales courantes au besoin
}

# Appliquer les mappings de touches spéciales
foreach ($keyEntry in $specialKeyMappings.GetEnumerator()) {
    if ($finalKey -eq $keyEntry.Key) {
        $finalKey = $keyEntry.Value
        break
    }
}

# Pour les touches F1-F24, les SendKeys veulent {F1}
if ($finalKey -match '(?i)^F(\d+)$') {
    $fnNumber = $Matches[1]
    $finalKey = "{F$($fnNumber)}"
}

# Cas particulier: lettres ou chiffres. Ils sont généralement juste la lettre/chiffre elle-même.
# Assurez-vous que si c'est une lettre, elle est passée telle quelle (SendKeys gère la majuscule via le modificateur Shift)
if ($finalKey.Length -eq 1 -and ($finalKey -match '^[a-zA-Z0-9]$')) {
    # Laisser la lettre telle quelle ou la passer en minuscule si elle était majuscule sans Shift
    $finalKey = $finalKey.ToLower() # SendKeys gère la majuscule si '+' (Shift) est déjà dans $sendKeysModifiers
}

# Combinaison finale : modificateurs d'abord, puis la touche
$translatedShortcut = $sendKeysModifiers + $finalKey

Write-Host "Raccourci original: '$Shortcut'"
Write-Host "Format SendKeys (avant simulation): '$translatedShortcut'" # Log pour le débogage

try {
    Simulate-Keys -Keys $translatedShortcut
    Write-Host "Raccourci simulé avec succès."
} catch {
    Write-Error "Échec de la simulation du raccourci: $($_.Exception.Message)"
    exit 1 # Indique un échec
}