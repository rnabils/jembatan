# Membuat public/favicon-jembatan.png dari public/jembatan-logo.png.
#
# Logonya berupa lockup penuh: marka jembatan, wordmark JEMBATAN, dan
# taglinenya, di atas latar hitam dengan pendar biru. Dipasang apa adanya
# sebagai favicon, pada 16 piksel wordmark dan taglinenya hanya menjadi noda,
# dan latar hitamnya tampil sebagai kotak gelap di bilah tab. Jadi markanya
# dipotong, lalu latarnya dibuang sampai benar-benar tembus pandang.
#
# Membuang latar tidak cukup dengan "hitam jadi transparan": marka ini punya
# garis dan bidang gelap di dalamnya, dan itu akan ikut berlubang. Karena itu
# piksel gelap hanya dibuang bila tersambung ke tepi gambar - yang gelap tetapi
# terkurung di dalam marka dibiarkan utuh. Pendar di sekeliling marka
# ditransisikan lewat alpha, supaya tepinya tidak bergerigi.
#
# Memakai System.Drawing yang sudah ada di Windows - tidak ada dependensi baru
# untuk proyeknya.
#
# Jalankan dari akar proyek:
#   powershell -ExecutionPolicy Bypass -File tools\buat-favicon.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$akar = Split-Path -Parent $PSScriptRoot
$sumber = Join-Path $akar 'public\jembatan-logo.png'
$keluaran = Join-Path $akar 'public\favicon-jembatan.png'

if (-not (Test-Path $sumber)) { throw "Tidak menemukan $sumber" }

# Kotak marka pada logo 1536x1024, diukur dari piksel terangnya dan berhenti
# di atas wordmark. Sesuaikan bila logonya diganti dengan versi lain.
$mx = 348; $my = 14; $mw = 840; $mh = 742

$sisi = 256
$padding = 2

# Ambang kegelapan yang dianggap latar, dan rentang alpha untuk pendarnya.
# AMBANG juga menjadi batas penelusuran dari tepi.
$ambang = 110
$alphaLo = 10
$alphaHi = 140

$kode = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class Favicon
{
    // Mengembalikan potongan marka dengan latar gelap yang tersambung ke tepi
    // diubah menjadi transparan.
    public static Bitmap AngkatMarka(Bitmap sumber, Rectangle kotak, int ambang, int alphaLo, int alphaHi)
    {
        Bitmap potong = new Bitmap(kotak.Width, kotak.Height, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(potong))
        {
            g.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
            g.DrawImage(sumber, new Rectangle(0, 0, kotak.Width, kotak.Height), kotak, GraphicsUnit.Pixel);
        }

        int w = potong.Width, h = potong.Height;
        BitmapData data = potong.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        int panjang = Math.Abs(data.Stride) * h;
        byte[] px = new byte[panjang];
        Marshal.Copy(data.Scan0, px, 0, panjang);

        int[] terang = new int[w * h];
        for (int i = 0; i < w * h; i++)
        {
            int o = i * 4;                       // BGRA
            terang[i] = (px[o + 2] * 299 + px[o + 1] * 587 + px[o] * 114) / 1000;
        }

        // Telusuri dari tepi, hanya lewat piksel yang cukup gelap.
        bool[] latar = new bool[w * h];
        Stack<int> tumpuk = new Stack<int>();
        for (int x = 0; x < w; x++)
        {
            Dorong(tumpuk, latar, terang, ambang, x);
            Dorong(tumpuk, latar, terang, ambang, (h - 1) * w + x);
        }
        for (int y = 0; y < h; y++)
        {
            Dorong(tumpuk, latar, terang, ambang, y * w);
            Dorong(tumpuk, latar, terang, ambang, y * w + (w - 1));
        }

        while (tumpuk.Count > 0)
        {
            int i = tumpuk.Pop();
            int x = i % w, y = i / w;
            if (x > 0) Dorong(tumpuk, latar, terang, ambang, i - 1);
            if (x < w - 1) Dorong(tumpuk, latar, terang, ambang, i + 1);
            if (y > 0) Dorong(tumpuk, latar, terang, ambang, i - w);
            if (y < h - 1) Dorong(tumpuk, latar, terang, ambang, i + w);
        }

        int rentang = Math.Max(1, alphaHi - alphaLo);
        for (int i = 0; i < w * h; i++)
        {
            if (!latar[i]) continue;             // bagian dalam marka: biarkan utuh
            int a = ((terang[i] - alphaLo) * 255) / rentang;
            if (a < 0) a = 0;
            if (a > 255) a = 255;
            px[i * 4 + 3] = (byte)a;
        }

        Marshal.Copy(px, 0, data.Scan0, panjang);
        potong.UnlockBits(data);
        return potong;
    }

    private static void Dorong(Stack<int> tumpuk, bool[] latar, int[] terang, int ambang, int i)
    {
        if (latar[i] || terang[i] > ambang) return;
        latar[i] = true;
        tumpuk.Push(i);
    }
}
'@

Add-Type -TypeDefinition $kode -ReferencedAssemblies System.Drawing

$src = [System.Drawing.Bitmap]::new($sumber)
try {
  if ($src.Width -ne 1536 -or $src.Height -ne 1024) {
    Write-Warning "Ukuran logo $($src.Width)x$($src.Height), bukan 1536x1024 seperti saat kotak marka diukur. Periksa hasilnya."
  }

  $kotak = New-Object System.Drawing.Rectangle($mx, $my, $mw, $mh)
  $marka = [Favicon]::AngkatMarka($src, $kotak, $ambang, $alphaLo, $alphaHi)
  try {
    $ruang = $sisi - $padding * 2
    $skala = [Math]::Min($ruang / $mw, $ruang / $mh)
    $lebar = [int][Math]::Round($mw * $skala)
    $tinggi = [int][Math]::Round($mh * $skala)

    $dst = New-Object System.Drawing.Bitmap($sisi, $sisi, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.Clear([System.Drawing.Color]::Transparent)
      $tujuan = New-Object System.Drawing.Rectangle([int](($sisi - $lebar) / 2), [int](($sisi - $tinggi) / 2), $lebar, $tinggi)
      $asal = New-Object System.Drawing.Rectangle(0, 0, $mw, $mh)
      $g.DrawImage($marka, $tujuan, $asal, [System.Drawing.GraphicsUnit]::Pixel)
    } finally { $g.Dispose() }

    $dst.Save($keluaran, [System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
  } finally { $marka.Dispose() }
} finally { $src.Dispose() }

$f = Get-Item $keluaran
Write-Host ("Selesai: {0} ({1:N0} bytes, {2}x{2}, berlatar transparan)" -f $f.Name, $f.Length, $sisi)

