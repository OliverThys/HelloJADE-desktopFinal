# Script de test d'appel vers le numero utilisateur
Write-Host "Test d'appel vers +32471034785..." -ForegroundColor Green

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
    
    # Verifier les gateways SIP
    Write-Host "Verification des gateways SIP..." -ForegroundColor Blue
    $gateways = & $fsCliExe -H localhost -x "sofia status gateway" 2>&1
    Write-Host "Gateways SIP:" -ForegroundColor Yellow
    Write-Host $gateways -ForegroundColor White
    
    # Lancer un appel de test
    Write-Host "Lancement d'un appel de test vers +32471034785..." -ForegroundColor Blue
    Write-Host "Utilisation du gateway Zadarma..." -ForegroundColor Gray
    
    # Commande d'origine d'appel
    $originateCmd = "originate {origination_caller_id_number=+32480206284,origination_caller_id_name=HelloJADE}sofia/gateway/zadarma/+32471034785 &echo"
    
    Write-Host "Commande: $originateCmd" -ForegroundColor Gray
    Write-Host "Lancement de l'appel..." -ForegroundColor Yellow
    
    # Executer l'appel
    $result = & $fsCliExe -H localhost -x $originateCmd 2>&1
    
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

Write-Host "Test termine!" -ForegroundColor Green
