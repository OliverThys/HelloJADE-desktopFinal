# Installation FreeSWITCH simple et corrigée pour HelloJADE
Write-Host "Installation FreeSWITCH pour HelloJADE" -ForegroundColor Green

# Vérifier les droits administrateur
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Ce script doit être exécuté en tant qu'administrateur!" -ForegroundColor Red
    exit 1
}

Write-Host "Mode administrateur détecté" -ForegroundColor Green

# Installer Chocolatey si nécessaire
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installation de Chocolatey..." -ForegroundColor Blue
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Installer les dépendances
Write-Host "Installation des dépendances..." -ForegroundColor Yellow
choco install git wget 7zip -y

# Essayer d'installer FreeSWITCH via Chocolatey
Write-Host "Installation de FreeSWITCH via Chocolatey..." -ForegroundColor Blue
try {
    choco install freeswitch -y
    Write-Host "FreeSWITCH installé via Chocolatey" -ForegroundColor Green
} catch {
    Write-Host "Échec de l'installation via Chocolatey, tentative de téléchargement direct..." -ForegroundColor Yellow
    
    # Télécharger FreeSWITCH depuis une URL alternative
    $freeswitchUrl = "https://github.com/signalwire/freeswitch/releases/download/v1.10.9/FreeSWITCH-1.10.9-Release-x64.msi"
    $freeswitchInstaller = "$env:TEMP\FreeSWITCH-1.10.9-Release-x64.msi"
    
    try {
        Invoke-WebRequest -Uri $freeswitchUrl -OutFile $freeswitchInstaller
        Write-Host "Téléchargement réussi" -ForegroundColor Green
        
        # Installer FreeSWITCH
        Start-Process msiexec.exe -Wait -ArgumentList "/i $freeswitchInstaller /quiet /norestart"
        Write-Host "Installation de FreeSWITCH terminée" -ForegroundColor Green
    } catch {
        Write-Host "Erreur lors du téléchargement: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Vérifier l'installation
Write-Host "Vérification de l'installation..." -ForegroundColor Yellow
$freeswitchPaths = @(
    "C:\Program Files\FreeSWITCH\freeswitch.exe",
    "C:\freeswitch\freeswitch.exe",
    "C:\Program Files (x86)\FreeSWITCH\freeswitch.exe"
)

$freeswitchExe = $null
foreach ($path in $freeswitchPaths) {
    if (Test-Path $path) {
        $freeswitchExe = $path
        Write-Host "FreeSWITCH trouvé: $path" -ForegroundColor Green
        break
    }
}

if (-not $freeswitchExe) {
    Write-Host "FreeSWITCH non trouvé après installation" -ForegroundColor Red
    exit 1
}

# Créer les répertoires de configuration
$freeswitchDir = Split-Path $freeswitchExe -Parent
$configDir = "$freeswitchDir\conf\hellojade"

if (!(Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force
    Write-Host "Répertoire de configuration créé: $configDir" -ForegroundColor Green
}

# Créer le fichier de configuration Zadarma
$zadarmaConfig = @'
<profile name="zadarma">
  <settings>
    <param name="username" value="382400"/>
    <param name="password" value="votre_mot_de_passe_sip"/>
    <param name="realm" value="sip.zadarma.com"/>
    <param name="register" value="true"/>
    <param name="register-transport" value="udp"/>
    <param name="proxy" value="sip.zadarma.com"/>
    <param name="outbound-proxy" value="sip.zadarma.com"/>
    <param name="expires" value="600"/>
    <param name="register-proxy" value="sip.zadarma.com"/>
    <param name="codec-prefs" value="PCMU,PCMA,G729"/>
    <param name="dtmf-type" value="rfc2833"/>
    <param name="tls" value="false"/>
    <param name="tls-verify" value="false"/>
    <param name="caller-id-in-from" value="true"/>
    <param name="caller-id" value="+32480206284"/>
    <param name="debug" value="0"/>
    <param name="sip-trace" value="false"/>
    <param name="sip-capture" value="false"/>
  </settings>
</profile>
'@

$zadarmaConfig | Out-File -FilePath "$configDir\zadarma.xml" -Encoding UTF8
Write-Host "Configuration Zadarma créée" -ForegroundColor Green

# Créer le répertoire d'enregistrements
$recordingsDir = "$freeswitchDir\recordings"
if (!(Test-Path $recordingsDir)) {
    New-Item -ItemType Directory -Path $recordingsDir -Force
    Write-Host "Répertoire d'enregistrements créé: $recordingsDir" -ForegroundColor Green
}

# Créer le script de démarrage
$startScript = @"
# Script de démarrage FreeSWITCH pour HelloJADE
Write-Host "Démarrage de FreeSWITCH pour HelloJADE..." -ForegroundColor Green

# Arrêter FreeSWITCH s'il est déjà en cours
Get-Process -Name "freeswitch" -ErrorAction SilentlyContinue | Stop-Process -Force

# Démarrer FreeSWITCH
Start-Process -FilePath "$freeswitchExe" -ArgumentList "-conf $freeswitchDir\conf" -WindowStyle Hidden

# Attendre que le service démarre
Start-Sleep -Seconds 5

# Vérifier que FreeSWITCH est démarré
`$process = Get-Process -Name "freeswitch" -ErrorAction SilentlyContinue
if (`$process) {
    Write-Host "FreeSWITCH démarré avec succès (PID: `$(`$process.Id))" -ForegroundColor Green
} else {
    Write-Host "Erreur lors du démarrage de FreeSWITCH" -ForegroundColor Red
}

Write-Host "FreeSWITCH est prêt pour HelloJADE!" -ForegroundColor Cyan
"@

$startScript | Out-File -FilePath "start-freeswitch-simple.ps1" -Encoding UTF8
Write-Host "Script de démarrage créé" -ForegroundColor Green

Write-Host "Installation terminée!" -ForegroundColor Green
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Modifiez le mot de passe SIP dans: $configDir\zadarma.xml" -ForegroundColor White
Write-Host "2. Exécutez: .\start-freeswitch-simple.ps1" -ForegroundColor White
Write-Host "3. Testez la connexion" -ForegroundColor White
