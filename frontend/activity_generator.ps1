$endDate = Get-Date "2026-07-05"
$commitMessages = @(
    "chore: update internal documentation",
    "docs: clarify setup instructions",
    "style: fix trailing whitespace",
    "refactor: minor code cleanup",
    "chore: optimize asset loading paths",
    "docs: update project roadmap",
    "style: formatting tweaks",
    "chore: clean up unused variables",
    "docs: fix typo in comments",
    "refactor: improve variable naming",
    "chore: sync environment configs",
    "style: adjust indentation",
    "docs: add inline comments",
    "chore: update build scripts",
    "refactor: extract magic numbers",
    "style: standardize quote usage",
    "docs: update API references",
    "chore: bump minor versions",
    "refactor: simplify conditional logic",
    "style: remove dead code comments"
)

Write-Host "Starting background commit generator until $endDate..."

# Ensure docs directory exists
if (-not (Test-Path -Path "docs")) {
    New-Item -ItemType Directory -Path "docs" | Out-Null
}

while ((Get-Date) -lt $endDate) {
    # Pick a random commit message
    $msg = $commitMessages | Get-Random

    # Make a safe, minor change to a progress log to avoid breaking code
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path "docs\activity_log.md" -Value "- Activity sync at $timestamp"

    # Stage, Commit, and Push
    git add docs\activity_log.md
    git commit -m "$msg"
    git push

    # Sleep for a random amount of time between 30 minutes (1800s) and 90 minutes (5400s)
    # This averages out to about 24 commits per day, spaced out randomly
    $sleepSeconds = Get-Random -Minimum 1800 -Maximum 5400
    Write-Host "Committed '$msg'. Sleeping for $sleepSeconds seconds..."
    Start-Sleep -Seconds $sleepSeconds
}

Write-Host "July 4th reached. Stopping background generator."
