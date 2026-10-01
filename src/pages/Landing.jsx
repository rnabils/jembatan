import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Lock,
  User,
  Wallet,
  ShieldCheck
} from 'lucide-react'
import { getRememberedLogin, useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

const DEMO_ACCOUNTS = [
  { role: 'Administrator', username: 'admin', password: 'admin123' },
  { role: 'Employee', username: 'employee', password: 'employee123' },
  { role: 'Viewer', username: 'viewer', password: 'viewer123' }
]

function formatCurrency(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value))}`
}

// Panel kaca. Bingkainya satu garis rambut, ditambah sorot tipis di tepi atas
// seperti tepi kaca yang menangkap cahaya.
//
// Sebelumnya ada bingkai kedua di dalam panel, sejajar sejarak sepuluh piksel.
// Dua garis sejajar sama-sama terbaca sebagai tepi, jadi batas panelnya
// menjadi kabur tanpa ada yang bertambah.
// Tiap panel setinggi isinya sendiri. Sempat dipaksa mengikuti tinggi baris
// grid agar ketiganya rata bawah, tapi kartu anggaran memang berisi lebih
// sedikit daripada panel masuk - meregangkannya hanya memindahkan ruang kosong
// ke dalam kartu.
function NeonPanel({ className = '', children }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[30px] bg-[#071429]/90 shadow-[0_28px_80px_-24px_rgba(2,10,26,0.95)] ring-1 ring-white/10 backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.11),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/55 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  )
}

// Label kecil berhuruf besar di atas nominal. Memberi hierarki tanpa menambah
// warna, sehingga angkanya tetap yang paling menonjol. Dipakai di kartu
// anggaran maupun panel masuk, supaya ketiganya terbaca satu keluarga.
function FieldLabel({ children, className = '' }) {
  return (
    <p className={`text-[10px] font-medium uppercase tracking-[0.22em] text-sky-200/60 ${className}`}>
      {children}
    </p>
  )
}

function BudgetGauge({ label, subtitle, icon: Icon, percentage, accent, primaryValue, secondaryValue, secondaryLabel }) {
  const clamped = Math.max(0, Math.min(100, percentage))

  return (
    <NeonPanel className="p-5 sm:p-6">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.9rem]">{label}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      {/* Garis pemisah kepala dan isi. Sisa tinggi kartu jadi terbaca sebagai
          struktur, bukan ruang yang kebetulan kosong. */}
      <div className="mt-4 h-px bg-white/10" />

      {/* Cincin dan angkanya dipasangkan - sejajar tengah, bukan direntang ke
          dua ujung. Merentangkannya sempat membuat jaraknya acak: seratus
          piksel di satu celah, lima puluh di celah berikutnya. */}
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Cincinnya dibesarkan dari 160 ke 192 piksel. Dengan isi kartu yang
            kini meregang penuh, ukuran lama membuatnya terbaca menggantung di
            tengah kolomnya sendiri. */}
        <div className="flex shrink-0 items-center justify-center lg:w-52">
          <div
            aria-hidden="true"
            className="relative flex h-48 w-48 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${accent} ${clamped}%, rgba(148, 163, 184, 0.14) ${clamped}% 100%)`,
              filter: `drop-shadow(0 0 20px ${accent}40)`
            }}
          >
            <div className="absolute inset-5 rounded-full bg-[#05101f] ring-1 ring-inset ring-white/10" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#071429] text-sky-200 ring-1 ring-white/10">
              <Icon className="h-9 w-9" />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {/* tabular-nums supaya 57 dan 43 sama lebar dan tidak bergeser dari
              satu kartu ke kartu sebelahnya. */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-bold tabular-nums tracking-tighter text-white sm:text-6xl">
              {Math.round(clamped)}
            </span>
            <span className="text-2xl font-medium text-sky-300/90">%</span>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-inset ring-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${clamped}%`,
                background: `linear-gradient(90deg, ${accent}, #7cc4ff)`,
                boxShadow: `0 0 14px ${accent}88`
              }}
            />
          </div>

          {/* Daftar nominal: label di kiri, angka rata kanan, dipisah garis
              dengan tinggi baris yang sama. Tepi kanan yang sejajar itu yang
              membuatnya terbaca tertata - sebelumnya label dan angka bertumpuk
              dengan jarak yang berbeda-beda. */}
          <dl className="mt-6">
            <div className="flex items-center justify-between gap-4 border-t border-white/10 py-4">
              <dt><FieldLabel>{secondaryLabel}</FieldLabel></dt>
              <dd className="whitespace-nowrap text-lg font-semibold tabular-nums tracking-tight text-white">
                {formatCurrency(secondaryValue)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 py-4">
              <dt><FieldLabel>Pagu</FieldLabel></dt>
              <dd className="whitespace-nowrap text-lg font-semibold tabular-nums tracking-tight text-white">
                {formatCurrency(primaryValue)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </NeonPanel>
  )
}

function LoginPanel({ onLogin, onFillDemo, username, setUsername, password, setPassword, showPassword, setShowPassword, error, submitting }) {
  return (
    <NeonPanel className="p-5 sm:p-6">
      <div className="flex flex-col">
        <div className="flex flex-col items-center text-center">
          {/* Marka berlatar transparan, bukan logo lockup penuh: di kotak
              sekecil ini wordmark dan taglinenya tidak terbaca, dan latar
              hitamnya tampil sebagai kotak gelap di dalam panel kaca.
              Wadahnya dulu memakai h-18/w-18 yang tidak ada di skala Tailwind,
              jadi ukurannya tidak pernah benar-benar ditetapkan. */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-sky-300/25">
            <img src="/favicon-jembatan.png" alt="Logo Jembatan" className="h-14 w-14 object-contain" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-sky-300">Selamat Datang</h2>
          <p className="mt-1.5 text-sm text-slate-400">Silakan login untuk melanjutkan</p>
        </div>

        {/* Pemisah yang sama dengan kartu anggaran, supaya ketiganya terbaca
            memakai susunan kepala-isi yang sama. */}
        <div className="mt-5 h-px bg-white/10" />

        <form onSubmit={onLogin} className="mt-5 space-y-4">
          <div>
            <FieldLabel className="mb-1.5">Username</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="h-12 rounded-xl border-white/10 bg-[#04101d]/85 pl-10 pr-10 text-white placeholder:text-slate-500 focus-visible:border-sky-300 focus-visible:ring-sky-300/30"
                required
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/80">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div>
            <FieldLabel className="mb-1.5">Password</FieldLabel>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12 rounded-xl border-white/10 bg-[#04101d]/85 pl-10 pr-11 text-white placeholder:text-slate-500 focus-visible:border-sky-300 focus-visible:ring-sky-300/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/80 transition-colors hover:text-white"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/30">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            variant="teal"
            className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2f8cff] to-[#12c5d5] text-base font-semibold tracking-[0.12em] shadow-[0_10px_30px_-8px_rgba(47,140,255,0.85)] ring-1 ring-sky-300/30 transition-all hover:from-[#3f97ff] hover:to-[#15d8ea] hover:shadow-[0_14px_38px_-8px_rgba(47,140,255,1)]"
            disabled={submitting}
          >
            {submitting ? 'Memproses...' : 'LOGIN'}
          </Button>
        </form>

        {/* 
        <div className="mt-6 rounded-2xl border border-sky-400/15 bg-[#04101d]/70 p-4">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200/70">
            Quick Demo Access
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => onFillDemo(account)}
                className="rounded-xl border border-sky-300/20 bg-white/5 px-2 py-2 text-xs font-medium text-sky-100 transition-colors hover:border-sky-300/40 hover:bg-sky-300/10"
              >
                {account.role}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">Pilih role untuk autofill, lalu login.</p>
        </div>*/}
      </div>
    </NeonPanel>
  )
}

export default function Landing() {
  const { login, isAuthenticated } = useAuth()
  const { stats } = useData()
  const navigate = useNavigate()
  const rememberedLogin = getRememberedLogin()
  const [username, setUsername] = useState(rememberedLogin.username)
  const [password, setPassword] = useState(rememberedLogin.password)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const budget = stats.budget

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    setTimeout(async () => {
      const result = await login(username, password)
      if (result.success) {
        navigate('/transition', { replace: true })
      } else {
        setError(result.message)
      }
      setSubmitting(false)
    }, 320)
  }

  const fillDemo = (account) => {
    setUsername(account.username)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <style>{`\
        @keyframes bgZoom {\
          0% {\
            transform: scale(1) translate3d(0, 0, 0);\
          }\
          100% {\
            transform: scale(1.08) translate3d(-1.5%, -1%, 0);\
          }\
        }\
      `}</style>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/background-jembatan.jpeg')",
            animation: 'bgZoom 18s ease-in-out infinite alternate',
            transformOrigin: 'center center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#021122]/35 via-[#061326]/80 to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.1]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col justify-center gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        {/* items-start: tiap kartu berhenti di tinggi isinya sendiri, jadi
            kartu anggaran tetap ringkas dan tidak ikut setinggi panel masuk. */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_340px] xl:items-start">
          <BudgetGauge
            label="Realisasi Anggaran"
            subtitle="Persentase Realisasi Anggaran"
            icon={ArrowUpRight}
            percentage={budget.realisasiPercent}
            accent="#46a7ff"
            primaryValue={budget.totalPagu}
            secondaryValue={budget.totalRealisasi}
            secondaryLabel="Realisasi"
          />

          <BudgetGauge
            label="Sisa Anggaran"
            subtitle="Persentase Sisa Anggaran"
            icon={Wallet}
            percentage={budget.sisaPercent}
            accent="#2fe0e8"
            primaryValue={budget.totalPagu}
            secondaryValue={budget.totalSisa}
            secondaryLabel="Sisa Anggaran"
          />

          <LoginPanel
            onLogin={handleSubmit}
            onFillDemo={fillDemo}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={error}
            submitting={submitting}
          />
        </div>

      </div>
    </div>
  )
}
