# Installation portable de FreeSWITCH (sans droits admin)
Write-Host "Installation portable de FreeSWITCH pour HelloJADE" -ForegroundColor Green

# Créer un répertoire local pour FreeSWITCH
$freeswitchDir = ".\freeswitch-portable"
if (!(Test-Path $freeswitchDir)) {
    New-Item -ItemType Directory -Path $freeswitchDir -Force
    Write-Host "Répertoire FreeSWITCH portable créé: $freeswitchDir" -ForegroundColor Green
}

# Essayer plusieurs URLs de téléchargement
$downloadUrls = @(
    "https://github.com/signalwire/freeswitch/releases/download/v1.10.9/FreeSWITCH-1.10.9-Release-x64.zip",
    "https://files.freeswitch.org/windows/installer/x64/FreeSWITCH-1.10.9-Release-x64.zip",
    "https://files.freeswitch.org/windows/installer/x64/FreeSWITCH-1.10.8-Release-x64.zip"
)

$freeswitchZip = "$env:TEMP\FreeSWITCH-Release-x64.zip"
$downloadSuccess = $false

foreach ($url in $downloadUrls) {
    try {
        Write-Host "Tentative de téléchargement depuis: $url" -ForegroundColor Blue
        Invoke-WebRequest -Uri $url -OutFile $freeswitchZip -TimeoutSec 30
        Write-Host "Téléchargement réussi" -ForegroundColor Green
        $downloadSuccess = $true
        break
    } catch {
        Write-Host "Échec du téléchargement: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
}

if (-not $downloadSuccess) {
    Write-Host "Impossible de télécharger FreeSWITCH depuis toutes les sources" -ForegroundColor Red
    Write-Host "Tentative d'installation via winget..." -ForegroundColor Yellow
    
    # Essayer d'installer via winget
    try {
        winget install --id=FreeSWITCH.FreeSWITCH -e
        Write-Host "FreeSWITCH installé via winget" -ForegroundColor Green
    } catch {
        Write-Host "Échec de l'installation via winget" -ForegroundColor Red
        exit 1
    }
} else {
    # Extraire FreeSWITCH
    Write-Host "Extraction de FreeSWITCH..." -ForegroundColor Blue
    try {
        Expand-Archive -Path $freeswitchZip -DestinationPath $freeswitchDir -Force
        Write-Host "Extraction terminée" -ForegroundColor Green
    } catch {
        Write-Host "Erreur lors de l'extraction: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Vérifier l'installation
$freeswitchExe = ".\freeswitch-portable\freeswitch.exe"
if (!(Test-Path $freeswitchExe)) {
    # Chercher dans les sous-répertoires
    $foundExe = Get-ChildItem -Path $freeswitchDir -Name "freeswitch.exe" -Recurse | Select-Object -First 1
    if ($foundExe) {
        $freeswitchExe = ".\freeswitch-portable\$foundExe"
        Write-Host "FreeSWITCH trouvé: $freeswitchExe" -ForegroundColor Green
    } else {
        Write-Host "FreeSWITCH non trouvé après installation" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "FreeSWITCH trouvé: $freeswitchExe" -ForegroundColor Green
}

# Créer les répertoires de configuration
$configDir = ".\freeswitch-portable\conf"
$sipProfilesDir = "$configDir\sip_profiles\external"
$dialplanDir = "$configDir\dialplan"

# Créer les répertoires
if (!(Test-Path $sipProfilesDir)) {
    New-Item -ItemType Directory -Path $sipProfilesDir -Force
}

if (!(Test-Path $dialplanDir)) {
    New-Item -ItemType Directory -Path $dialplanDir -Force
}

# Créer la configuration Zadarma
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

$zadarmaConfig | Out-File -FilePath "$sipProfilesDir\zadarma.xml" -Encoding UTF8
Write-Host "Configuration Zadarma créée" -ForegroundColor Green

# Créer le dialplan médical
$medicalDialplan = @'
<context name="medical-followup">
  <extension name="medical-call">
    <condition field="destination_number" expression="^medical_(.+)$">
      <action application="set" data="patient_phone=$1"/>
      <action application="set" data="hospital_id=zadarma"/>
      <action application="answer"/>
      <action application="sleep" data="1000"/>
      <action application="playback" data="ivr/ivr-welcome_to_freeswitch.wav"/>
      <action application="sleep" data="2000"/>
      <action application="playback" data="ivr/ivr-please_hold_while_party_contacted.wav"/>
      <action application="sleep" data="3000"/>
      <action application="record_session" data=".\freeswitch-portable\recordings\response1_${strftime(%Y%m%d_%H%M%S)}.wav 30 300"/>
      <action application="playback" data="ivr/ivr-please_hold_while_party_contacted.wav"/>
      <action application="sleep" data="3000"/>
      <action application="record_session" data=".\freeswitch-portable\recordings\response2_${strftime(%Y%m%d_%H%M%S)}.wav 30 300"/>
      <action application="playback" data="ivr/ivr-thank_you.wav"/>
      <action application="sleep" data="1000"/>
      <action application="hangup"/>
    </condition>
  </extension>
</context>
'@

$medicalDialplan | Out-File -FilePath "$dialplanDir\medical.xml" -Encoding UTF8
Write-Host "Dialplan médical créé" -ForegroundColor Green

# Créer le répertoire d'enregistrements
$recordingsDir = ".\freeswitch-portable\recordings"
if (!(Test-Path $recordingsDir)) {
    New-Item -ItemType Directory -Path $recordingsDir -Force
    Write-Host "Répertoire d'enregistrements créé: $recordingsDir" -ForegroundColor Green
}

# Créer le script de démarrage portable
$startScript = @"
# Script de démarrage FreeSWITCH portable pour HelloJADE
Write-Host "Démarrage de FreeSWITCH portable pour HelloJADE..." -ForegroundColor Green

# Arrêter FreeSWITCH s'il est déjà en cours
Get-Process -Name "freeswitch" -ErrorAction SilentlyContinue | Stop-Process -Force

# Démarrer FreeSWITCH portable
`$freeswitchExe = ".\freeswitch-portable\freeswitch.exe"
if (Test-Path `$freeswitchExe) {
    Start-Process -FilePath `$freeswitchExe -ArgumentList "-conf .\freeswitch-portable\conf" -WindowStyle Hidden
    
    # Attendre que le service démarre
    Start-Sleep -Seconds 5
    
    # Vérifier que FreeSWITCH est démarré
    `$process = Get-Process -Name "freeswitch" -ErrorAction SilentlyContinue
    if (`$process) {
        Write-Host "FreeSWITCH portable démarré avec succès (PID: `$(`$process.Id))" -ForegroundColor Green
    } else {
        Write-Host "Erreur lors du démarrage de FreeSWITCH portable" -ForegroundColor Red
    }
} else {
    Write-Host "FreeSWITCH portable non trouvé: `$freeswitchExe" -ForegroundColor Red
}

Write-Host "FreeSWITCH portable est prêt pour HelloJADE!" -ForegroundColor Cyan
"@

$startScript | Out-File -FilePath "start-freeswitch-portable-fixed.ps1" -Encoding UTF8

Write-Host "Installation portable terminée!" -ForegroundColor Green
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Exécutez: .\start-freeswitch-portable-fixed.ps1" -ForegroundColor White
Write-Host "2. Testez la connexion avec: .\test-freeswitch-zadarma.ps1" -ForegroundColor White
