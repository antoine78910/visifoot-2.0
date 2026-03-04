# Lance le backend (uvicorn) avec le venv
# Usage: .\run.ps1  (obligatoire le .\ en PowerShell)
Set-Location $PSScriptRoot
& .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
