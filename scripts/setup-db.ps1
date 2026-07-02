$ErrorActionPreference = "Stop"

$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host "Setting up hr_portal database and hr_user..."

# Prompt for root password
$rootPass = Read-Host "Enter your MySQL root password" -AsSecureString
$rootPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($rootPass)
)

$sql = @"
CREATE DATABASE IF NOT EXISTS hr_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hr_user'@'localhost' IDENTIFIED BY 'hr_password';
GRANT ALL PRIVILEGES ON hr_portal.* TO 'hr_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully.' AS result;
"@

$sql | & $mysqlBin -u root -p"$rootPassPlain" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Done! hr_portal database is ready." -ForegroundColor Green
    Write-Host "User: hr_user  /  Password: hr_password" -ForegroundColor Cyan
} else {
    Write-Host "Something went wrong. Check your root password and try again." -ForegroundColor Red
}
