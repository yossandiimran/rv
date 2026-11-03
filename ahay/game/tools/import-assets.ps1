# Shrinks the generated PNGs in assets/incoming and files them under the names the game expects.
# Run from the game folder:  powershell -ExecutionPolicy Bypass -File tools/import-assets.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$in = Join-Path $root 'assets\incoming'
$sheets = Join-Path $root 'assets\sheets'
$thumbs = Join-Path $root 'assets\thumbs'
New-Item -ItemType Directory -Force -Path $in, $sheets, $thumbs | Out-Null

# incoming prefix -> final file names (must match js/data/characters.js and js/data/bosses.js)
$map = @(
  @{ id = 'windah-basudara'; sheet = 'playable-windah-basudara-combat-v3.png'; thumb = '05-windah-basudara-v3.png' },
  @{ id = 'ferry-irwandi';   sheet = 'playable-ferry-irwandi-combat-v3.png';   thumb = '06-ferry-irwandi-v3.png' },
  @{ id = 'jokowi';          sheet = 'enemy-jokowi-combat-v3.png';             thumb = '11-jokowi-v3.png' },
  @{ id = 'dedi-mulyadi';    sheet = 'enemy-dedi-mulyadi-combat-v3.png';       thumb = '12-dedi-mulyadi-v3.png' }
)

function Save-Resized($srcPath, $dstPath, $w, $h) {
  $src = [System.Drawing.Bitmap]::FromFile($srcPath)
  try {
    if ($h -le 0) { $h = [int][math]::Round($src.Height * $w / $src.Width) }
    $dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.CompositingMode = 'SourceCopy'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($src, 0, 0, $w, $h); $g.Dispose()
    $dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    # warn if the corners are not transparent (a flat background would show up as a box in the game)
    $corners = @($dst.GetPixel(0, 0).A, $dst.GetPixel($w - 1, 0).A, $dst.GetPixel(0, $h - 1).A, $dst.GetPixel($w - 1, $h - 1).A)
    if (($corners | Measure-Object -Maximum).Maximum -gt 8) { Write-Warning "$([IO.Path]::GetFileName($srcPath)): corners are not transparent - check the background" }
    $dst.Dispose()
  } finally { $src.Dispose() }
}

foreach ($c in $map) {
  $combat = Join-Path $in "$($c.id)-combat.png"
  $thumb = Join-Path $in "$($c.id)-thumb.png"
  if (-not (Test-Path $combat) -or -not (Test-Path $thumb)) { Write-Host "skip $($c.id): need $($c.id)-combat.png and $($c.id)-thumb.png in assets/incoming"; continue }
  # sheet: 4x2 cells of 256 px -> 1024x512 (the game slices cells at runtime)
  Save-Resized $combat (Join-Path $sheets $c.sheet) 1024 512
  # thumbnail: 320 px tall, keep aspect
  $img = [System.Drawing.Image]::FromFile($thumb); $tw = [int][math]::Round($img.Width * 320 / $img.Height); $img.Dispose()
  Save-Resized $thumb (Join-Path $thumbs $c.thumb) $tw 320
  Write-Host "imported $($c.id)"
}
Write-Host 'done. Reload the game: imported characters replace their SEGERA HADIR cards.'
