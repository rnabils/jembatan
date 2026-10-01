import { Building2, CalendarDays, FileCheck2, Package, Wallet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { formatRupiah, formatTanggalIndo, punyaPsp, dataTidakLengkap } from '../../lib/assetWorkbook'
import { kondisiMeta } from '../../data/assetPalette'

function Baris({ label, value, tabular = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`min-w-0 text-right text-sm font-medium text-[#233b84] ${tabular ? 'tabular-nums' : ''}`}>
        {value || '-'}
      </span>
    </div>
  )
}

function Grup({ icon: Icon, judul, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eff5ff] text-[#1f63d3]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-bold text-[#233b84]">{judul}</h3>
      </div>
      <div className="mt-1 divide-y divide-slate-50">{children}</div>
    </div>
  )
}

export function AssetDetail({ asset, open, onOpenChange }) {
  if (!asset) return null

  const meta = kondisiMeta(asset.kondisi)
  const Icon = meta.icon
  const kosong = dataTidakLengkap(asset)
  const susutPersen = asset.nilaiPerolehan
    ? Math.round((asset.nilaiPenyusutan / asset.nilaiPerolehan) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              <Package className="h-3 w-3" /> {asset.jenisBmn}
            </span>
            <DialogTitle className="mt-2">{asset.namaBarang}</DialogTitle>
            <DialogDescription>
              Kode Barang {asset.kodeBarang || '-'} &middot; NUP {asset.nup || '-'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={meta.badge} className="gap-1">
            <Icon className="h-3 w-3" /> {meta.label}
          </Badge>
          {asset.statusBmn ? <Badge variant="outline">{asset.statusBmn}</Badge> : null}
          {punyaPsp(asset) ? (
            <Badge variant="success" className="gap-1">
              <FileCheck2 className="h-3 w-3" /> Sudah PSP
            </Badge>
          ) : (
            <Badge variant="warning">Belum ada PSP</Badge>
          )}
          {asset.nilaiBuku === 0 ? <Badge variant="destructive">Nilai buku Rp0</Badge> : null}
        </div>

        {kosong.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Data belum lengkap pada kolom: {kosong.join(', ')}.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Grup icon={Package} judul="Identitas">
            <Baris label="Nama Barang" value={asset.namaBarang} />
            <Baris label="Kode Barang" value={asset.kodeBarang} tabular />
            <Baris label="NUP" value={asset.nup} tabular />
            <Baris label="Jenis BMN" value={asset.jenisBmn} />
            <Baris label="Merk" value={asset.merk} />
            <Baris label="Tipe" value={asset.tipe} />
            <Baris label="Intra / Extra" value={asset.intraExtra} />
          </Grup>

          <Grup icon={Wallet} judul="Nilai">
            <Baris label="Nilai Perolehan" value={formatRupiah(asset.nilaiPerolehan)} tabular />
            <Baris label="Nilai Penyusutan" value={formatRupiah(asset.nilaiPenyusutan)} tabular />
            <Baris label="Nilai Buku" value={formatRupiah(asset.nilaiBuku)} tabular />
            <Baris label="Penyusutan" value={`${susutPersen}% dari nilai perolehan`} tabular />
            <Baris label="Tanggal Perolehan" value={formatTanggalIndo(asset.tanggalPerolehan)} />
          </Grup>

          <Grup icon={CalendarDays} judul="Kondisi">
            <Baris label="Kondisi Fisik" value={meta.label} />
            <Baris label="Status BMN" value={asset.statusBmn} />
            <Baris label="Umur Aset" value={`${asset.umurAset} tahun`} tabular />
          </Grup>

          <Grup icon={FileCheck2} judul="PSP">
            <Baris label="Nomor PSP" value={asset.noPsp} tabular />
            <Baris label="Tanggal PSP" value={formatTanggalIndo(asset.tanggalPsp)} />
            <Baris label="Status" value={punyaPsp(asset) ? 'Sudah ditetapkan' : 'Belum ditetapkan'} />
          </Grup>

          <Grup icon={Building2} judul="Penggunaan">
            <Baris label="Status Penggunaan" value={asset.statusPenggunaan} />
            <Baris label="Satuan Kerja" value={asset.namaSatker} />
            <Baris label="Kode Satker" value={asset.kodeSatker} tabular />
          </Grup>
        </div>
      </DialogContent>
    </Dialog>
  )
}
