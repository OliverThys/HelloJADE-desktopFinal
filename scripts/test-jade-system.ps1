# Script de test pour le système JADE
# Teste tous les composants du dialogue médical automatisé

Write-Host "🧪 Test du système HelloJADE - Dialogue JADE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Variables
$backendUrl = "http://localhost:3000"
$rasaUrl = "http://localhost:5005"
$whisperUrl = "http://localhost:9000"
$ollamaUrl = "http://localhost:11434"

# Fonction pour tester un endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    try {
        Write-Host "🔍 Test de $Name..." -ForegroundColor Yellow
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body ($Body | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        }
        
        Write-Host "✅ $Name : OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Name : ERREUR - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test 1: Backend Node.js
Write-Host "`n📡 Test du Backend Node.js" -ForegroundColor Magenta
$backendOk = Test-Endpoint -Url "$backendUrl/health" -Name "Backend Health"
$backendOk = $backendOk -and (Test-Endpoint -Url "$backendUrl/api/calls/status" -Name "Backend Calls API")

# Test 2: Rasa (Agent conversationnel)
Write-Host "`n🤖 Test de Rasa" -ForegroundColor Magenta
$rasaOk = Test-Endpoint -Url "$rasaUrl/" -Name "Rasa Server"

# Test 3: Whisper (Transcription)
Write-Host "`n🎙️ Test de Whisper" -ForegroundColor Magenta
$whisperOk = Test-Endpoint -Url "$whisperUrl/" -Name "Whisper Server"

# Test 4: Ollama (LLM)
Write-Host "`n🧠 Test d'Ollama" -ForegroundColor Magenta
$ollamaOk = Test-Endpoint -Url "$ollamaUrl/api/tags" -Name "Ollama API"

# Test 5: Test du dialogue JADE complet
Write-Host "`n🎯 Test du dialogue JADE" -ForegroundColor Magenta

if ($backendOk -and $rasaOk) {
    try {
        Write-Host "🔍 Test du dialogue JADE..." -ForegroundColor Yellow
        
        # Simuler un appel médical JADE
        $jadeTestData = @{
            hospitalId = "MONS"
            patientNumber = "+32485123456"
            patientId = "test-patient-001"
            patientName = "Dupont"
            patientFirstName = "Marie"
        }
        
        $response = Invoke-RestMethod -Uri "$backendUrl/api/calls/medical" -Method POST -Body ($jadeTestData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        Write-Host "✅ Dialogue JADE : Appel simulé lancé avec succès" -ForegroundColor Green
        Write-Host "   Call ID: $($response.callId)" -ForegroundColor Gray
        
        # Test de sauvegarde des données JADE
        $jadeData = @{
            callId = $response.callId
            jadeData = @{
                patient_confirme = $true
                identite_verifiee = $true
                douleur_niveau = 3
                douleur_localisation = "tête"
                traitement_suivi = $true
                transit_normal = $true
                probleme_transit = ""
                moral_niveau = 7
                moral_details = ""
                fievre = $false
                temperature = 0
                autres_plaintes = "rien de spécial"
            }
            transcript = "Bonjour, je suis Jade... [transcript complet]"
            medicalScore = 85
        }
        
        $saveResponse = Invoke-RestMethod -Uri "$backendUrl/api/calls/save-jade-data" -Method POST -Body ($jadeData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        Write-Host "✅ Données JADE sauvegardées avec succès" -ForegroundColor Green
        
    }
    catch {
        Write-Host "❌ Dialogue JADE : ERREUR - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Test d'urgence
Write-Host "`n🚨 Test de détection d'urgence" -ForegroundColor Magenta

try {
    $emergencyData = @{
        callId = "test-emergency-001"
        emergencyType = "medical_emergency"
        patientData = @{
            name = "Test Patient"
            phone = "+32485123456"
        }
    }
    
    $emergencyResponse = Invoke-RestMethod -Uri "$backendUrl/api/calls/emergency" -Method POST -Body ($emergencyData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
    
    Write-Host "✅ Détection d'urgence : OK" -ForegroundColor Green
}
catch {
    Write-Host "❌ Détection d'urgence : ERREUR - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Test d'export
Write-Host "`n📊 Test d'export" -ForegroundColor Magenta

try {
    $exportData = @{
        format = "csv"
        filters = @{
            search = ""
            dateFrom = $null
            dateTo = $null
            status = ""
            hospitalSite = ""
            service = ""
        }
    }
    
    $exportResponse = Invoke-RestMethod -Uri "$backendUrl/api/calls/export" -Method POST -Body ($exportData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
    
    Write-Host "✅ Export CSV : OK" -ForegroundColor Green
}
catch {
    Write-Host "❌ Export : ERREUR - $($_.Exception.Message)" -ForegroundColor Red
}

# Résumé des tests
Write-Host "`n📋 Résumé des tests" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$services = @(
    @{ Name = "Backend Node.js"; Status = $backendOk },
    @{ Name = "Rasa (Agent)"; Status = $rasaOk },
    @{ Name = "Whisper (Transcription)"; Status = $whisperOk },
    @{ Name = "Ollama (LLM)"; Status = $ollamaOk }
)

foreach ($service in $services) {
    $status = if ($service.Status) { "✅ OK" } else { "❌ ERREUR" }
    $color = if ($service.Status) { "Green" } else { "Red" }
    Write-Host "$($service.Name): $status" -ForegroundColor $color
}

$allServicesOk = $backendOk -and $rasaOk -and $whisperOk -and $ollamaOk

if ($allServicesOk) {
    Write-Host "`n🎉 Tous les services sont opérationnels !" -ForegroundColor Green
    Write-Host "Le système HelloJADE avec dialogue JADE est prêt à être utilisé." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Certains services ne sont pas disponibles." -ForegroundColor Yellow
    Write-Host "Vérifiez les logs des services en erreur." -ForegroundColor Yellow
}

Write-Host "`n🔗 URLs des services:" -ForegroundColor Cyan
Write-Host "  - Backend: $backendUrl" -ForegroundColor Gray
Write-Host "  - Rasa: $rasaUrl" -ForegroundColor Gray
Write-Host "  - Whisper: $whisperUrl" -ForegroundColor Gray
Write-Host "  - Ollama: $ollamaUrl" -ForegroundColor Gray

Write-Host "`n✨ Test terminé !" -ForegroundColor Cyan
