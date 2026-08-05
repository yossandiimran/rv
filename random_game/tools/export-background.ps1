param(
    [Parameter(Mandatory = $true)]
    [string]$InputImage,

    [Parameter(Mandatory = $true)]
    [string]$OutputImage,

    [int]$Width = 640,
    [int]$Height = 360,
    [double]$FocusY = 0.5,
    [switch]$Opaque
)

$ErrorActionPreference = 'Stop'
$assetRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

foreach ($path in @($InputImage, $OutputImage)) {
    $absolute = [System.IO.Path]::GetFullPath($path)
    if (-not $absolute.StartsWith($assetRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path escapes random_game: $absolute"
    }
}

if (-not (Test-Path -LiteralPath $InputImage)) {
    throw "Input not found: $InputImage"
}

if (Test-Path -LiteralPath $OutputImage) {
    throw "Refusing to overwrite: $OutputImage"
}

if ($FocusY -lt 0.0 -or $FocusY -gt 1.0) {
    throw 'FocusY must be between 0 and 1.'
}

New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($OutputImage)) -Force | Out-Null
Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $InputImage))
try {
    $targetRatio = $Width / [double]$Height
    $sourceRatio = $source.Width / [double]$source.Height

    if ($sourceRatio -gt $targetRatio) {
        $cropHeight = $source.Height
        $cropWidth = [int][Math]::Round($cropHeight * $targetRatio)
        $cropX = [int][Math]::Round(($source.Width - $cropWidth) / 2.0)
        $cropY = 0
    }
    else {
        $cropWidth = $source.Width
        $cropHeight = [int][Math]::Round($cropWidth / $targetRatio)
        $cropX = 0
        $availableY = $source.Height - $cropHeight
        $cropY = [int][Math]::Round($availableY * $FocusY)
    }

    $destination = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($destination)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

            $destinationRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
            $sourceRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)
            $graphics.DrawImage($source, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
        }
        finally {
            $graphics.Dispose()
        }

        if ($Opaque) {
            $lockRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
            $bitmapData = $destination.LockBits(
                $lockRect,
                [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
            )
            try {
                $byteCount = [Math]::Abs($bitmapData.Stride) * $Height
                $pixels = New-Object byte[] $byteCount
                [System.Runtime.InteropServices.Marshal]::Copy($bitmapData.Scan0, $pixels, 0, $byteCount)
                for ($y = 0; $y -lt $Height; $y++) {
                    $rowStart = $y * [Math]::Abs($bitmapData.Stride)
                    for ($x = 0; $x -lt $Width; $x++) {
                        $pixels[$rowStart + ($x * 4) + 3] = 255
                    }
                }
                [System.Runtime.InteropServices.Marshal]::Copy($pixels, 0, $bitmapData.Scan0, $byteCount)
            }
            finally {
                $destination.UnlockBits($bitmapData)
            }
        }

        $destination.Save($OutputImage, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $destination.Dispose()
    }

    [PSCustomObject]@{
        Input = $InputImage
        Output = $OutputImage
        SourceSize = "{0}x{1}" -f $source.Width, $source.Height
        Crop = "{0},{1} {2}x{3}" -f $cropX, $cropY, $cropWidth, $cropHeight
        RuntimeSize = "{0}x{1}" -f $Width, $Height
        Opaque = [bool]$Opaque
    }
}
finally {
    $source.Dispose()
}
