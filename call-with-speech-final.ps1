# Script final d'appel avec synthese vocale
param(
    [Parameter(Mandatory=$true)]
    [string]$PhoneNumber,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Hello, this is a test call from HelloJADE. The system is working perfectly. Thank you and goodbye."
)

Write-Host "Appel avec synthese vocale vers $PhoneNumber..." -ForegroundColor Green

# Verifier que FreeSWITCH est en cours d'execution
$freeswitchProcess = Get-Process -Name "*freeswitch*" -ErrorAction SilentlyContinue
if (-not $freeswitchProcess) {
    Write-Host "FreeSWITCH n'est pas en cours d'execution!" -ForegroundColor Red
    Write-Host "Demarrez d'abord FreeSWITCH avec: .\start-freeswitch-working.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "FreeSWITCH est en cours d'execution (PID: $($freeswitchProcess.Id))" -ForegroundColor Green

# Tester la connexion avec fs_cli
Write-Host "Test de connexion a FreeSWITCH..." -ForegroundColor Blue
$fsCliExe = "C:\Program Files\FreeSWITCH\fs_cli.exe"

try {
    # Verifier le statut de FreeSWITCH
    $status = & $fsCliExe -H localhost -x "status" 2>&1
    if ($status -match "UP") {
        Write-Host "FreeSWITCH est operationnel!" -ForegroundColor Green
    } else {
        Write-Host "FreeSWITCH n'est pas pret" -ForegroundColor Red
        exit 1
    }
    
    # Lancer l'appel avec bgapi
    Write-Host "Lancement d'un appel vers $PhoneNumber..." -ForegroundColor Blue
    Write-Host "Message: $Message" -ForegroundColor Gray
    
    # Commande bgapi pour lancer l'appel avec le message personnalise
    $bgapiCmd = "bgapi originate sofia/gateway/zadarma/$PhoneNumber &answer &sleep(1000) &say(en|en|$Message) &sleep(2000) &hangup"
    
    Write-Host "Commande: $bgapiCmd" -ForegroundColor Gray
    Write-Host "Lancement de l'appel..." -ForegroundColor Yellow
    
    # Executer l'appel
    $result = & $fsCliExe -H localhost -x $bgapiCmd 2>&1
    
    Write-Host "Resultat de l'appel:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor White
    
    if ($result -match "SUCCESS") {
        Write-Host "Appel lance avec succes!" -ForegroundColor Green
    } elseif ($result -match "ERROR") {
        Write-Host "Erreur lors de l'appel: $result" -ForegroundColor Red
    } else {
        Write-Host "Appel en cours..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Erreur lors du test d'appel: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Script termine!" -ForegroundColor Green
