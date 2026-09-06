$overlay = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbs = Join-Path $overlay "start-overlay.vbs"
$startup = [Environment]::GetFolderPath("Startup")
$lnk = Join-Path $startup "WowQuickRef Overlay.lnk"

$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut($lnk)
$s.TargetPath = "wscript.exe"
$s.Arguments = "`"$vbs`""
$s.WorkingDirectory = $overlay
$s.WindowStyle = 7
$s.Save()

Write-Host "Overlay will start with Windows."
Write-Host "Remove later by deleting:`n$lnk"
