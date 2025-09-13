# Script de demarrage FreeSWITCH qui fonctionne
Write-Host "Demarrage de FreeSWITCH pour HelloJADE..." -ForegroundColor Green

# Verifier les droits administrateur
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Ce script doit etre execute en tant qu'administrateur!" -ForegroundColor Red
    exit 1
}

# Arreter FreeSWITCH s'il est deja en cours
Get-Process -Name "*freeswitch*" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Creer les repertoires temporaires
$tempLogDir = "$env:TEMP\freeswitch"
if (!(Test-Path $tempLogDir)) {
    New-Item -ItemType Directory -Path $tempLogDir -Force
}

# Demarrer FreeSWITCH avec les repertoires temporaires
$freeswitchExe = "C:\Program Files\FreeSWITCH\FreeSwitchConsole.exe"
$confDir = "C:\Program Files\FreeSWITCH\conf"

Write-Host "Demarrage de FreeSWITCH..." -ForegroundColor Blue
Write-Host "Configuration: $confDir" -ForegroundColor Gray
Write-Host "Logs temporaires: $tempLogDir" -ForegroundColor Gray

try {
    $process = Start-Process -FilePath $freeswitchExe -ArgumentList "-conf", $confDir, "-log", $tempLogDir, "-db", $tempLogDir -WindowStyle Hidden -PassThru
    Write-Host "Processus FreeSWITCH lance (PID: $($process.Id))" -ForegroundColor Green
    
    # Attendre que le processus demarre
    Start-Sleep -Seconds 5
    
    # Verifier que le processus est toujours actif
    $runningProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if ($runningProcess) {
        Write-Host "FreeSWITCH demarre avec succes!" -ForegroundColor Green
        
        # Tester la connexion
        Write-Host "Test de connexion..." -ForegroundColor Blue
        $fsCliExe = "C:\Program Files\FreeSWITCH\fs_cli.exe"
        if (Test-Path $fsCliExe) {
            $result = & $fsCliExe -H localhost -x "status" 2>&1
            if ($result -match "UP") {
                Write-Host "FreeSWITCH est operationnel!" -ForegroundColor Green
                Write-Host "FreeSWITCH est pret pour HelloJADE!" -ForegroundColor Cyan
            } else {
                Write-Host "FreeSWITCH demarre mais pas encore pret" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "FreeSWITCH s'est arrete apres le demarrage" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors du demarrage: $($_.Exception.Message)" -ForegroundColor Red
}

# Afficher les processus FreeSWITCH actifs
$activeProcesses = Get-Process -Name "*freeswitch*" -ErrorAction SilentlyContinue
if ($activeProcesses) {
    Write-Host "Processus FreeSWITCH actifs:" -ForegroundColor Yellow
    foreach ($proc in $activeProcesses) {
        Write-Host "  - $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor White
    }
}

Write-Host "Script termine!" -ForegroundColor Green
