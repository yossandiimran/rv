param(
    [Parameter(Mandatory = $true)]
    [string]$InputChroma,

    [Parameter(Mandatory = $true)]
    [string]$AlphaOutput,

    [Parameter(Mandatory = $true)]
    [string]$RuntimeOutput,

    [int]$Columns = 4,
    [int]$Rows = 4,
    [int]$CellWidth = 32,
    [int]$CellHeight = 48
)

$ErrorActionPreference = 'Stop'

foreach ($path in @($InputChroma, $AlphaOutput, $RuntimeOutput)) {
    $resolved = [System.IO.Path]::GetFullPath($path)
    if (-not $resolved.StartsWith([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')),
            [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path escapes random_game: $resolved"
    }
}

if (-not (Test-Path -LiteralPath $InputChroma)) {
    throw "Input not found: $InputChroma"
}

foreach ($output in @($AlphaOutput, $RuntimeOutput)) {
    if (Test-Path -LiteralPath $output) {
        throw "Refusing to overwrite: $output"
    }
    New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($output)) -Force | Out-Null
}

$chromaHelper = 'C:\Users\Central Dev\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
& python $chromaHelper `
    --input $InputChroma `
    --out $AlphaOutput `
    --auto-key border `
    --soft-matte `
    --transparent-threshold 12 `
    --opaque-threshold 220 `
    --despill

if ($LASTEXITCODE -ne 0) {
    throw "Chroma-key removal failed with exit code $LASTEXITCODE"
}

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class RuntimeSpriteExporter {
    public static string Export(string input, string output, int columns, int rows, int cellW, int cellH) {
        using (var src = new Bitmap(input)) {
            Rectangle[,] boxes = new Rectangle[rows, columns];
            int maxW = 1;
            int maxH = 1;

            for (int row = 0; row < rows; row++) {
                for (int column = 0; column < columns; column++) {
                    int x0 = (int)Math.Round(column * src.Width / (double)columns);
                    int x1 = (int)Math.Round((column + 1) * src.Width / (double)columns);
                    int y0 = (int)Math.Round(row * src.Height / (double)rows);
                    int y1 = (int)Math.Round((row + 1) * src.Height / (double)rows);
                    int minX = x1;
                    int minY = y1;
                    int maxX = x0 - 1;
                    int maxY = y0 - 1;

                    for (int y = y0; y < y1; y++) {
                        for (int x = x0; x < x1; x++) {
                            if (src.GetPixel(x, y).A > 12) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }

                    Rectangle box = maxX >= minX
                        ? Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1)
                        : new Rectangle(x0, y0, 1, 1);
                    boxes[row, column] = box;
                    if (box.Width > maxW) maxW = box.Width;
                    if (box.Height > maxH) maxH = box.Height;
                }
            }

            double scale = Math.Min((cellW - 2) / (double)maxW, (cellH - 2) / (double)maxH);

            using (var dst = new Bitmap(columns * cellW, rows * cellH, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(dst)) {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
                graphics.PixelOffsetMode = PixelOffsetMode.Half;
                graphics.SmoothingMode = SmoothingMode.None;

                for (int row = 0; row < rows; row++) {
                    for (int column = 0; column < columns; column++) {
                        Rectangle box = boxes[row, column];
                        int width = Math.Max(1, (int)Math.Round(box.Width * scale));
                        int height = Math.Max(1, (int)Math.Round(box.Height * scale));
                        int x = column * cellW + (cellW - width) / 2;
                        int y = row * cellH + cellH - height - 1;
                        graphics.DrawImage(src, new Rectangle(x, y, width, height), box, GraphicsUnit.Pixel);
                    }
                }

                dst.Save(output, ImageFormat.Png);
            }

            return String.Format(
                "{0}x{1} -> {2}x{3}; max bbox {4}x{5}; scale {6:F4}",
                src.Width,
                src.Height,
                columns * cellW,
                rows * cellH,
                maxW,
                maxH,
                scale
            );
        }
    }
}
'@

$summary = [RuntimeSpriteExporter]::Export(
    $AlphaOutput,
    $RuntimeOutput,
    $Columns,
    $Rows,
    $CellWidth,
    $CellHeight
)

$bitmap = [System.Drawing.Bitmap]::FromFile($RuntimeOutput)
try {
    $cornerAlpha = $bitmap.GetPixel(0, 0).A
    $width = $bitmap.Width
    $height = $bitmap.Height
}
finally {
    $bitmap.Dispose()
}

[PSCustomObject]@{
    AlphaOutput = $AlphaOutput
    RuntimeOutput = $RuntimeOutput
    Summary = $summary
    Width = $width
    Height = $height
    CornerAlpha = $cornerAlpha
    Bytes = (Get-Item -LiteralPath $RuntimeOutput).Length
}
