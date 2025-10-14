# Script pour corriger les imports NextAuth
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -Exclude "*.d.ts" | Where-Object { $_.Exists }

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Encoding UTF8
        $originalContent = $content -join "`n"
        
        if ($originalContent -match "getServerSession") {
            Write-Host "Fixing file: $($file.FullName)"
            
            # Replace imports
            $newContent = $originalContent -replace "import \{ getServerSession \} from 'next-auth';", "import { auth } from '@/lib/auth';"
            $newContent = $newContent -replace "import \{ getServerSession \} from `"next-auth`"", "import { auth } from '@/lib/auth';"
            
            # Remove authOptions import if it exists alone
            $newContent = $newContent -replace "import \{ authOptions \} from '@/lib/auth';\r?\n", ""
            
            # Replace function calls
            $newContent = $newContent -replace "getServerSession\(authOptions\)", "auth()"
            
            # Clean up duplicate imports
            $newContent = $newContent -replace "import \{ auth \} from '@/lib/auth';\r?\nimport \{ auth \} from '@/lib/auth';", "import { auth } from '@/lib/auth';"
            
            Set-Content $file.FullName $newContent -Encoding UTF8 -NoNewline
        }
    }
    catch {
        Write-Warning "Error processing file $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Auth fixes completed!"