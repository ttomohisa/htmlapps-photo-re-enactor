# Offline behavioral checks for the report-only dependency checker.
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$checkerPath = Join-Path $Root "scripts\check-dependency-updates.ps1"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("dependency-report-test-" + [Guid]::NewGuid().ToString("N"))
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Assert-ReportEqual($Actual, $Expected, [string]$Label) {
  if ($Actual -cne $Expected) { throw "${Label}: expected '$Expected', received '$Actual'." }
}

function New-TestDependency([string]$Id, [string]$Policy = "patch", [bool]$Enabled = $true) {
  return [ordered]@{
    id = $Id
    package = "synthetic-$Id"
    version = "1.2.3"
    updates = @{ policy = $Policy; enabled = $Enabled }
  }
}

# Shadow only the network boundary in this script's scope. The real report and
# policy-selection code still run, and an unexpected request fails immediately.
$registryRequests = New-Object System.Collections.Generic.List[string]
$registryMetadata = @{
  current = ('{"dist-tags":{"latest":"1.2.3"},"versions":{"1.2.3":{}}}' | ConvertFrom-Json)
  newer = ('{"dist-tags":{"latest":"2.0.0"},"versions":{"1.2.3":{},"1.2.4":{},"1.3.0":{},"2.0.0":{}}}' | ConvertFrom-Json)
}
function Invoke-RestMethod {
  param([string]$Uri, [switch]$UseBasicParsing, [hashtable]$Headers)
  $registryRequests.Add($Uri)
  switch -Exact ($Uri) {
    "https://registry.npmjs.org/synthetic-current" { return $registryMetadata.current }
    "https://registry.npmjs.org/synthetic-patch" { return $registryMetadata.newer }
    "https://registry.npmjs.org/synthetic-minor" { return $registryMetadata.newer }
    "https://registry.npmjs.org/synthetic-major" { return $registryMetadata.newer }
    "https://registry.npmjs.org/synthetic-manual" { return $registryMetadata.newer }
    default { throw "Unexpected registry request in offline test: $Uri" }
  }
}

$cases = @(
  @{ Name = "empty"; Dependencies = @(); Checked = 0; Disabled = 0; Targets = @(); Policies = @(); Types = @() },
  @{ Name = "null"; Dependencies = $null; Checked = 0; Disabled = 0; Targets = @(); Policies = @(); Types = @() },
  @{ Name = "single-disabled"; Dependencies = @((New-TestDependency "disabled" "patch" $false)); Checked = 0; Disabled = 1; Targets = @(); Policies = @(); Types = @() },
  @{ Name = "single-current"; Dependencies = @((New-TestDependency "current")); Checked = 1; Disabled = 0; Targets = @(); Policies = @(); Types = @() },
  @{ Name = "single-update"; Dependencies = @((New-TestDependency "patch")); Checked = 1; Disabled = 0; Targets = @("1.2.4"); Policies = @("patch"); Types = @("patch") },
  @{
    Name = "multiple-mixed"
    Dependencies = @(
      (New-TestDependency "patch"), (New-TestDependency "minor" "minor"),
      (New-TestDependency "major" "major"), (New-TestDependency "manual" "manual"),
      (New-TestDependency "current"), (New-TestDependency "disabled" "patch" $false)
    )
    Checked = 5; Disabled = 1
    Targets = @("1.2.4", "1.3.0", "2.0.0", "2.0.0")
    Policies = @("patch", "minor", "major", "manual")
    Types = @("patch", "minor", "major", "major")
  }
)

$failures = @()
try {
  foreach ($case in $cases) {
    $caseRoot = Join-Path $tempRoot $case.Name
    New-Item -ItemType Directory -Force -Path $caseRoot | Out-Null
    $manifestPath = Join-Path $caseRoot "dependencies.json"
    $lockPath = Join-Path $caseRoot "dependencies.lock.json"
    $jsonPath = Join-Path $caseRoot "report.json"
    $markdownPath = Join-Path $caseRoot "report.md"
    $manifestBefore = @{ dependencies = $case.Dependencies } | ConvertTo-Json -Depth 10
    $lockBefore = '{"schemaVersion":1,"dependencies":[]}'
    [System.IO.File]::WriteAllText($manifestPath, $manifestBefore, $utf8)
    [System.IO.File]::WriteAllText($lockPath, $lockBefore, $utf8)
    $registryRequests.Clear()

    try {
      & $checkerPath -DependenciesPath $manifestPath -JsonOutput $jsonPath -MarkdownOutput $markdownPath
      $report = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json
      $markdown = Get-Content -Raw -Encoding UTF8 $markdownPath
      $dependencyCount = if ($null -eq $case.Dependencies) { 0 } else { @($case.Dependencies).Count }
      Assert-ReportEqual $report.schemaVersion 1 "schema version"
      Assert-ReportEqual $report.dependencyCount $dependencyCount "dependency count"
      Assert-ReportEqual $report.checkedCount $case.Checked "checked count"
      Assert-ReportEqual $report.disabledCount $case.Disabled "disabled count"
      Assert-ReportEqual $report.updateCount $case.Targets.Count "update count"
      Assert-ReportEqual ($report.updates -is [array]) $true "updates is a JSON array"
      Assert-ReportEqual $report.updates.Count $case.Targets.Count "updates length"
      Assert-ReportEqual $registryRequests.Count $case.Checked "registry request count"
      Assert-ReportEqual ([string]::IsNullOrWhiteSpace($report.checkedAtUtc)) $false "report timestamp"
      [DateTimeOffset]::Parse($report.checkedAtUtc) | Out-Null
      Assert-ReportEqual ($markdown.Contains("<!-- single-html-template:dependency-update-report:v1 -->")) $true "report marker"

      for ($index = 0; $index -lt $case.Targets.Count; $index += 1) {
        $update = $report.updates[$index]
        $policy = $case.Policies[$index]
        Assert-ReportEqual $update.id $policy "dependency id"
        Assert-ReportEqual $update.package "synthetic-$policy" "package name"
        Assert-ReportEqual $update.currentVersion "1.2.3" "current version"
        Assert-ReportEqual $update.targetVersion $case.Targets[$index] "target version"
        Assert-ReportEqual $update.policy $policy "update policy"
        Assert-ReportEqual $update.changeType $case.Types[$index] "change type"
        Assert-ReportEqual $update.manualReview ($policy -eq "manual") "manual review"
        $review = if ($policy -eq "manual") { "manual review" } else { $policy }
        $row = '| `synthetic-' + $policy + '` | `1.2.3` | `' + $case.Targets[$index] + '` | ' + $case.Types[$index] + ' | ' + $review + ' |'
        Assert-ReportEqual ($markdown.Contains($row)) $true "Markdown update row"
      }
      if ($case.Targets.Count -eq 0) {
        Assert-ReportEqual ($markdown.Contains("No updates are currently available for the enabled dependency policies.")) $true "no-update message"
        Assert-ReportEqual ($markdown.Contains("| Dependency |")) $false "no update table"
      } else {
        Assert-ReportEqual ($markdown.Contains("This workflow only reports updates.")) $true "report-only message"
        Assert-ReportEqual ($markdown.Contains("### Review checklist")) $true "review checklist"
      }
      Assert-ReportEqual ([System.IO.File]::ReadAllText($manifestPath)) $manifestBefore "manifest remains unchanged"
      Assert-ReportEqual ([System.IO.File]::ReadAllText($lockPath)) $lockBefore "lock remains unchanged"
      Write-Host "[OK] Dependency report: $($case.Name)" -ForegroundColor Green
    } catch {
      $failures += "$($case.Name): $($_.Exception.Message)"
    }
  }
} finally {
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $tempRoot
}

if ($failures.Count -gt 0) { throw ($failures -join [Environment]::NewLine) }
Write-Host "[OK] All $($cases.Count) offline dependency-report cases passed." -ForegroundColor Green
