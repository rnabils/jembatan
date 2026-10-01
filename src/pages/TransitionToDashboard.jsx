import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function TransitionToDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { divisions } = useData()

  const handleExit = () => {
    logout()
    navigate('/', { replace: true })
  }

  const selectDivision = (divisionId) => {
    sessionStorage.setItem('bpk-dashboard-selected-division', divisionId)
    navigate('/dashboard', { replace: true })
  }

  const bubbleOrder = [
    { id: 'finance', title: 'Keuangan', image: '/keuangan.jpeg' },
    { id: 'hr', title: 'SDM', image: '/sdm.jpeg' },
    { id: 'legal', title: 'Hukum', image: '/hukum.jpeg' },
    { id: 'pr', title: 'Humas dan TU Kalan', image: '/humas-tukalan.jpeg' },
    { id: 'it', title: 'Umum dan TI', image: '/umum-ti.jpeg' }
  ]

  const bubbleDivisions = bubbleOrder
    .map((item) => {
      const division = divisions.find((entry) => entry.id === item.id)
      if (!division) return null
      return {
        ...division,
        title: item.title,
        image: item.image
      }
    })
    .filter(Boolean)

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <style>{`
        @keyframes bgZoom {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          100% {
            transform: scale(1.08) translate3d(-1.5%, -1%, 0);
          }
        }
        @keyframes floatBubble {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        /* Gerakan latar dan kartu yang berjalan terus-menerus melelahkan bagi
           sebagian orang, dan sistem operasi sudah menyediakan preferensinya. */
        @media (prefers-reduced-motion: reduce) {
          .jembatan-motion {
            animation: none !important;
          }
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="jembatan-motion absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/background-jembatan.jpeg')",
            animation: 'bgZoom 18s ease-in-out infinite alternate',
            transformOrigin: 'center center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/60 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.14),rgba(15,23,42,0.68))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%)]" />
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
        </div>
      </div>

      <div className="relative z-10 px-6 py-10 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={handleExit}
          className="absolute right-6 top-6 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium tracking-wide text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/10 sm:right-8 lg:right-12"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>

        {/* Tinggi dikurangi padding vertikalnya, supaya halaman ini pas satu
            layar dan tidak menyisakan gulir yang tak berisi apa-apa. */}
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col justify-between gap-8">
          <header className="pt-8 text-center sm:pt-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-sky-200/70 sm:text-[11px]">
              Main Dashboard
            </p>
            {/* Judul halaman ini sebelumnya hanya paragraf besar; sekarang h1,
                sehingga pembaca layar dan mesin telusur mengenalinya. */}
            <h1 className="mt-4 text-5xl font-black uppercase leading-none tracking-[0.1em] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)] sm:text-7xl sm:tracking-[0.14em] lg:text-8xl">
              Jembatan
            </h1>
            <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-white/45 to-transparent shadow-[0_0_18px_rgba(255,255,255,0.18)] sm:w-32" />
            <p className="mx-auto mt-4 max-w-lg text-balance text-sm font-light leading-relaxed tracking-wide text-slate-200/80 sm:text-base">
              Jendela Manajemen dan Kolaborasi Kesekretariatan
            </p>
          </header>

          {/* Enam kolom, tiap kartu mengambil dua. Baris kedua yang hanya berisi
              dua kartu digeser satu kolom supaya berhenti menggantung di kiri. */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6 xl:gap-8">
            {bubbleDivisions.map((division, index) => (
              <button
                key={division.id}
                type="button"
                onClick={() => selectDivision(division.id)}
                className={`jembatan-motion group relative mx-auto aspect-square w-full max-w-[270px] cursor-pointer overflow-hidden rounded-[50px] border border-white/10 bg-slate-900/40 shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 lg:col-span-2 ${
                  index === 3 ? 'lg:col-start-2' : ''
                }`}
                style={{ animation: `floatBubble ${6 + index * 0.8}s ease-in-out infinite` }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${division.image}')` }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.08),rgba(0,0,0,0.5))]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/22 to-transparent" />
                <div className="absolute inset-0 rounded-[50px] border border-white/10" />

                <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 pt-12 text-center sm:px-6 sm:pb-7">
                  <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-sky-200/70">
                    Subbagian
                  </p>
                  {/* Nama dua kata sebelumnya terputus timpang - "UMUM DAN / TI".
                      text-balance menyamakan panjang barisnya, dan tracking yang
                      lebih rapat memberi ruang untuk itu. */}
                  <p className="mt-1.5 text-balance text-lg font-bold uppercase leading-snug tracking-[0.13em] text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)] sm:text-xl">
                    {division.title}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <footer className="text-center">
            <p className="text-[10px] uppercase tracking-[0.38em] text-slate-300/60 sm:text-[11px]">
              {bubbleDivisions.length} Subbagian terhubung dalam satu portal
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
