import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, matchPath, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  X,
  Home,
  Users,
  GraduationCap,
  BookOpen,
  HeartPulse,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderArchive,
  AppWindow,
  LineChart,
  ScrollText,
  Building2,
  Boxes,
  Archive,
  Handshake
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { cn } from '../../lib/utils'
import { AGENDA_CATEGORY_ID } from '../../lib/agendaStorage'

const LEGACY_ICONS = {
  Users,
  Wallet: Building2,
  Scale: ClipboardList,
  Monitor: AppWindow,
  Megaphone: Home,
  ClipboardList,
  Archive,
  Building2
}

const DIVISION_ICON_MAP = {
  hr: {
    bezzetting: Users,
    bezetting: Users,
    diklat: GraduationCap,
    'manajemen-pengetahuan': BookOpen,
    klinik: HeartPulse,
    mcu: HeartPulse,
    'agenda-kalan': CalendarDays,
    'tata-usaha-kalan': ClipboardList,
    'publikasi-pemberitaan': Home,
    'dokumentasi-kegiatan': FileText,
    'arsip-pemeriksaan': FolderArchive,
    perpustakaan: BookOpen,
    jdih: ScrollText,
    'legislasi-review-mou': ClipboardList,
    perjanjian: Handshake,
    'manajemen-risiko': ShieldCheck,
    aset: Boxes,
    arsip: Archive,
    'pengadaan-barang-jasa': Building2,
    'peminjaman-aset': Building2
  },
  finance: {
    'realisasi-anggaran': LineChart,
    'sisa-anggaran': LineChart,
    'belanja-pegawai': Users,
    'belanja-barang': Boxes,
    'belanja-modal': Building2
  },
  legal: {
    jdih: ScrollText,
    'legislasi-review-mou': ClipboardList,
    perjanjian: Handshake,
    'manajemen-risiko': ShieldCheck
  },
  pr: {
    'agenda-kalan': CalendarDays,
    'tata-usaha-kalan': ClipboardList,
    'publikasi-pemberitaan': Home,
    'dokumentasi-kegiatan': FileText,
    'arsip-pemeriksaan': FolderArchive,
    perpustakaan: BookOpen
  },
  it: {
    aset: Boxes,
    arsip: Archive,
    'pengadaan-barang-jasa': Building2,
    'peminjaman-aset': Building2
  }
}

function DivisionItemIcon({ divisionId, categoryId, className }) {
  const Icon = DIVISION_ICON_MAP[divisionId]?.[categoryId] || FileText
  return <Icon className={className} />
}

const SECTION_ROUTES = ['/dashboard/kalender', '/dashboard/monitoring', '/dashboard/laporan', '/dashboard/panduan']

// Blok merek di kiri atas sekaligus jalan kembali ke pemilihan bidang.
//
// Sebelumnya logonya memang sudah bisa diklik, tetapi tanpa penanda apa pun:
// kursornya tidak berubah, tidak ada label, dan satu-satunya petunjuk adalah
// aria-label berbahasa Inggris yang hanya terbaca oleh pembaca layar. Orang
// yang baru memakai portal ini tidak punya cara untuk tahu.
//
// Sekarang tujuannya ditulis apa adanya - "Pilih bidang lain" - lengkap dengan
// panah, kursor tangan, latar yang berubah saat disentuh, dan cincin fokus
// untuk papan ketik. Petunjuknya selalu terlihat, bukan muncul saat hover,
// karena pada layar sentuh hover tidak pernah terjadi.
//
// Keterangan panjang "Jendela Manajemen dan Kolaborasi Kesekretariatan"
// digantikan label itu. Di sini ia melipat jadi dua baris dan tidak memberi
// tahu apa pun yang bisa dikerjakan; namanya sudah muncul di halaman masuk dan
// halaman pemilihan bidang.
function BrandBackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Kembali ke pilihan bidang"
      aria-label="Kembali ke pilihan bidang"
      className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition-colors group-hover:bg-white/15">
        <img src="/favicon-jembatan.png" alt="" className="h-8 w-8 object-contain" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight text-white">JEMBATAN</span>
        <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium leading-tight text-sky-200/85 transition-colors group-hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          Pilih bidang lain
        </span>
      </span>
    </button>
  )
}

function SidebarNavButton({ icon: Icon, label, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all active:scale-[0.99]',
        isActive
          ? 'bg-white text-[#0b2d5a] shadow-[0_10px_24px_rgba(255,255,255,0.12)]'
          : 'text-white/88 hover:bg-white/8 hover:text-white'
      )}
    >
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', isActive ? 'bg-[#1f63d3] text-white' : 'bg-white/10 text-sky-100')}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <span className="flex-1 text-sm font-medium leading-tight">{label}</span>
      {count !== undefined && (
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', isActive ? 'bg-[#1f63d3] text-white' : 'bg-white/10 text-sky-100')}>
          {count}
        </span>
      )}
    </button>
  )
}

function DivisionSidebar({ divisionId, onCloseMobile }) {
  const { user, isAdmin } = useAuth()
  const { getDocumentDivision, getDocumentCategories, stats, documents, agendaEvents } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboardRoute = location.pathname === '/dashboard'
  const currentPath = location.pathname
  const isSectionRoute = SECTION_ROUTES.includes(currentPath)

  const division = getDocumentDivision(divisionId)
  const categories = getDocumentCategories(divisionId)
  const punyaArsip = categories.some((category) => category.id === 'arsip')
  const storageKey = `bpk-dashboard-active-category-${divisionId}`
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    // Kategori tersimpan bisa menunjuk layanan yang kini disembunyikan.
    const stored = sessionStorage.getItem(storageKey)
    const dikenal = stored && categories.some((category) => category.id === stored)
    return dikenal ? stored : categories[0]?.id || 'all'
  })

  useEffect(() => {
    if (isDashboardRoute) {
      setActiveCategoryId(null)
      return
    }

    const stored = sessionStorage.getItem(storageKey)
    const dikenal = stored && categories.some((category) => category.id === stored)
    setActiveCategoryId(dikenal ? stored : categories[0]?.id || 'all')
  }, [isDashboardRoute, storageKey, categories])

  useEffect(() => {
    const onCategoryChange = (event) => {
      if (event.detail?.divisionId === divisionId) {
        setActiveCategoryId(event.detail.categoryId)
      }
    }
    window.addEventListener('bpk-dashboard-category-change', onCategoryChange)
    return () => window.removeEventListener('bpk-dashboard-category-change', onCategoryChange)
  }, [divisionId])

  const selectCategory = (categoryId) => {
    const nextCategory = categoryId || categories[0]?.id || 'all'
    sessionStorage.setItem(storageKey, nextCategory)
    sessionStorage.setItem('bpk-dashboard-selected-division', divisionId)
    setActiveCategoryId(nextCategory)
    window.dispatchEvent(new CustomEvent('bpk-dashboard-category-change', { detail: { divisionId, categoryId: nextCategory } }))
    navigate(`/dashboard/division/${divisionId}`)
  }

  const categoryCounts = useMemo(() => {
    return Object.fromEntries(
      categories.map((category) => [
        category.id,
        category.id === AGENDA_CATEGORY_ID
          ? agendaEvents.filter((event) => event.divisionId === divisionId && event.categoryId === category.id).length
          : documents.filter((document) => document.divisionId === divisionId && document.categoryId === category.id).length
      ])
    )
  }, [categories, documents, agendaEvents, divisionId])

  if (!division) return null

  const totalDivisionDocs = stats.documentsByDivision.find((item) => item.id === divisionId)?.total || 0

  return (
    <aside className="flex w-full flex-col bg-[#0b2d5a] text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:sticky lg:top-0 lg:h-screen lg:w-[290px]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-4">
        <BrandBackButton onClick={() => navigate('/transition')} />
        <button
          onClick={onCloseMobile}
          className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Tutup sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex w-full items-center gap-3 rounded-xl bg-[#1f63d3] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,99,211,0.28)] transition-transform hover:translate-y-[-1px]"
        >
          <Home className="h-5 w-5" />
          Dashboard
        </button>

        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/65">Layanan</p>
        <div className="mt-3 space-y-1.5">
          {categories.map((category) => {
            const ActiveIcon = DIVISION_ICON_MAP[divisionId]?.[category.id] || FileText
            const isActive = !isDashboardRoute && !isSectionRoute && activeCategoryId === category.id
            return (
              <SidebarNavButton
                key={category.id}
                icon={ActiveIcon}
                label={category.name}
                count={categoryCounts[category.id] || 0}
                isActive={isActive}
                onClick={() => selectCategory(category.id)}
              />
            )
          })}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/65">Monitoring</p>
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Kalender Bersama', icon: CalendarDays, path: '/dashboard/kalender' },
              { label: 'Monitoring Layanan', icon: LineChart, path: '/dashboard/monitoring', adminSaja: true },
              { label: 'Laporan', icon: ClipboardList, path: '/dashboard/laporan', adminSaja: true }
            ]
              // Untuk sementara hanya admin yang melihat rekap lintas bidang.
              // Kalender Bersama tetap terbuka untuk semua.
              .filter((item) => isAdmin || !item.adminSaja)
              .map((item) => (
                <SidebarNavButton
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPath === item.path}
                  onClick={() => {
                    sessionStorage.setItem('bpk-dashboard-selected-division', divisionId)
                    navigate(item.path)
                  }}
                />
              ))}
          </div>
        </div>

        {(isAdmin || punyaArsip) && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/65">Dokumen</p>
            <div className="mt-3 space-y-1.5">
              {isAdmin && (
                <SidebarNavButton
                  icon={FileText}
                  label="Semua Dokumen"
                  count={Object.values(categoryCounts).reduce((total, count) => total + count, 0)}
                  isActive={!isDashboardRoute && !isSectionRoute && activeCategoryId === 'all'}
                  onClick={() => selectCategory('all')}
                />
              )}
              {punyaArsip && (
                <SidebarNavButton
                  icon={FolderArchive}
                  label="Arsip Digital"
                  count={categoryCounts.arsip || 0}
                  isActive={!isDashboardRoute && !isSectionRoute && activeCategoryId === 'arsip'}
                  onClick={() => selectCategory('arsip')}
                />
              )}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/65">Bantuan</p>
          <div className="mt-3 space-y-1.5">
            <SidebarNavButton
              icon={BookOpen}
              label="Panduan Sistem"
              isActive={currentPath === '/dashboard/panduan'}
              onClick={() => {
                sessionStorage.setItem('bpk-dashboard-selected-division', divisionId)
                navigate('/dashboard/panduan')
              }}
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/65">Integrasi Aplikasi</p>
          <div className="mt-3 rounded-xl bg-[#14376b] p-3">
            <p className="text-sm font-semibold text-white">JASMIN</p>
            <p className="mt-1 text-xs text-sky-100/75">Integrasi Aplikasi (Persuratan)</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-sky-100/70">
          {user?.name}
          <br />
          {totalDivisionDocs} dokumen pada bidang ini
        </p>
      </div>
    </aside>
  )
}

function LegacySidebar({ mobileOpen, onCloseMobile }) {
  const { isAdmin, isEmployee, user } = useAuth()
  const { divisions, stats } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const [divisionsExpanded, setDivisionsExpanded] = useState(true)

  const divisionMatch = matchPath('/dashboard/division/:divisionId/*', location.pathname) || matchPath('/division/:divisionId/*', location.pathname)
  const activeDivisionId = divisionMatch?.params?.divisionId
  const employeeDivision = divisions.find((division) => division.id === user?.division)
  const selectedDivisionId = sessionStorage.getItem('bpk-dashboard-selected-division')
  const selectedDivision = selectedDivisionId
    ? divisions.find((division) => division.id === selectedDivisionId)
    : null
  const visibleDivisions = isEmployee
    ? [selectedDivision, employeeDivision]
        .filter(Boolean)
        .filter((division, index, list) => list.findIndex((item) => item.id === division.id) === index)
    : activeDivisionId
      ? divisions.filter((division) => division.id === activeDivisionId)
      : []

  const linkBase = 'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
  const linkActive = 'bg-teal/10 text-teal-700 border-l-4 border-teal -ml-[4px] pl-[16px]'
  const linkInactive = 'text-slate-300 hover:bg-white/5 hover:text-white'

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-4">
          <BrandBackButton onClick={() => navigate('/transition')} />
          <button
            onClick={onCloseMobile}
            className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5 scrollbar-none">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkInactive)}
            onClick={onCloseMobile}
          >
            <LayoutDashboard className="h-[18px] w-[18px]" />
            Dashboard
          </NavLink>

          {visibleDivisions.length > 0 && (
            <button
              onClick={() => setDivisionsExpanded((v) => !v)}
              className="mt-4 flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              {isEmployee ? 'My / Selected Division' : 'Current Division'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', divisionsExpanded ? '' : '-rotate-90')} />
            </button>
          )}

          {divisionsExpanded && visibleDivisions.length > 0 && (
            <div className="space-y-1">
              {visibleDivisions.map((d) => {
                const Icon = LEGACY_ICONS[d.icon] || Building2
                const pendingCount = stats.perDivision.find((p) => p.id === d.id)?.pending || 0
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('bpk-dashboard-selected-division', d.id)
                      navigate('/dashboard')
                      onCloseMobile()
                    }}
                    className={cn(linkBase, 'w-full border-l-0 text-left', activeDivisionId === d.id ? linkActive : linkInactive)}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 truncate">{d.name}</span>
                    {isAdmin && pendingCount > 0 && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {isAdmin && (
            <>
              <p className="mt-4 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Administration
              </p>
              <NavLink
                to="/approvals"
                className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkInactive)}
                onClick={onCloseMobile}
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
                <span className="flex-1">Approvals</span>
                {stats.pending > 0 && (
                  <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                    {stats.pending}
                  </span>
                )}
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-slate-400">
            Badan Pemeriksa Keuangan Republik Indonesia
            <br />
            Internal use only &copy; 2026
          </p>
        </div>
      </aside>
    </>
  )
}

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth()
  const location = useLocation()
  const divisionMatch = matchPath('/dashboard/division/:divisionId/*', location.pathname) || matchPath('/division/:divisionId/*', location.pathname)
  const isDashboardRoute = location.pathname === '/dashboard'
  const isProfileRoute = location.pathname === '/profile'
  const isSectionRoute = SECTION_ROUTES.includes(location.pathname)
  const selectedDivisionId = sessionStorage.getItem('bpk-dashboard-selected-division') || user?.division || 'finance'

  if (divisionMatch || isDashboardRoute || isProfileRoute || isSectionRoute) {
    const activeDivisionId = divisionMatch?.params?.divisionId || selectedDivisionId
    if (!activeDivisionId) {
      return <LegacySidebar mobileOpen={mobileOpen} onCloseMobile={onCloseMobile} />
    }
    return <DivisionSidebar divisionId={activeDivisionId} onCloseMobile={onCloseMobile} />
  }

  return <LegacySidebar mobileOpen={mobileOpen} onCloseMobile={onCloseMobile} />
}