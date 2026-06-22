# NexusHR Frontend Automatic Runner

$currentDir = $PSScriptRoot
$frontendDir = Join-Path $currentDir "frontend"

cd $frontendDir

Write-Output "Installing Node packages..."
npm install

Write-Output "Launching React 19 Frontend Dashboard..."
npm run dev
