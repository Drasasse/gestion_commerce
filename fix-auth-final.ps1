# Script pour corriger tous les imports et appels getServerSession
Write-Host "Correction des imports et appels NextAuth..." -ForegroundColor Green

# Trouver tous les fichiers .ts dans src/
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Where-Object { $_.Name -notlike "*.d.ts" }

$totalFiles = $files.Count
$processedFiles = 0

foreach ($file in $files) {
    $processedFiles++
    Write-Progress -Activity "Correction des fichiers" -Status "Traitement de $($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    try {
        $content = Get-Content $file.FullName
        $originalContent = $content -join "`n"
        $newContent = $originalContent
        
        # Remplacer les imports getServerSession
        $newContent = $newContent -replace "import \{ getServerSession \} from 'next-auth';", "import { auth } from '@/lib/auth';"
        $newContent = $newContent -replace "import \{ getServerSession \} from `"next-auth`";", "import { auth } from '@/lib/auth';"
        
        # Supprimer les imports authOptions si getServerSession a ete remplace
        if ($newContent -match "import \{ auth \} from '@/lib/auth';") {
            $newContent = $newContent -replace "import \{ authOptions \} from '@/lib/auth';\s*", ""
            $newContent = $newContent -replace "import \{ authOptions \} from `"@/lib/auth`";\s*", ""
        }
        
        # Remplacer les appels getServerSession(authOptions)
        $newContent = $newContent -replace "getServerSession\(authOptions\)", "auth()"
        
        # Nettoyer les lignes vides multiples
        $newContent = $newContent -replace "`n`n`n+", "`n`n"
        
        # Sauvegarder seulement si le contenu a change
        if ($newContent -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $newContent
            Write-Host "Corrige: $($file.Name)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Erreur avec $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Correction terminee!" -ForegroundColor Green
Write-Host "Fichiers traites: $processedFiles" -ForegroundColor Cyan