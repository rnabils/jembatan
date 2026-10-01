import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Menu, Search, Bell, LogOut, User, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Avatar } from '../ui/avatar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../ui/dropdown-menu'
import { formatDate } from '../../lib/utils'
import { getRoleInfo } from '../../data/accessControl'

export function Topbar({ onOpenMobile }) {
  const { user, logout, isAdmin } = useAuth()
  const { documents, divisions, getDocumentCategory } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return documents
      .filter(
        (document) =>
          document.title.toLowerCase().includes(q) ||
          document.description?.toLowerCase().includes(q) ||
          document.fileName?.toLowerCase().includes(q) ||
          document.documentNumber?.toLowerCase().includes(q)
      )
      .slice(0, 6)
  }, [search, documents])

  const notifications = useMemo(() => {
    if (isAdmin) {
      return documents
        .filter((document) => document.status === 'pending')
        .slice(0, 6)
        .map((document) => ({
          ...document,
          date: document.uploadedAt || document.documentDate,
          message: `Dokumen menunggu review: "${document.title}"`
        }))
    }
    return documents
      .filter((document) => document.uploadedBy === user?.name && document.status !== 'pending')
      .slice(0, 6)
      .map((document) => ({
        ...document,
        date: document.uploadedAt || document.documentDate,
        message: `Dokumen Anda "${document.title}" berstatus ${document.status}.`
      }))
  }, [documents, isAdmin, user])

  const roleInfo = getRoleInfo(user?.role)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search documents..."
            className="h-10 w-72 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:border-teal lg:w-96"
          />
          {searchOpen && search.trim() && (
            <div className="absolute left-0 top-12 z-40 w-full rounded-md border border-slate-200 bg-white p-2 shadow-panel">
              {searchResults.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">No results found.</p>
              )}
              {searchResults.map((r) => {
                const div = divisions.find((d) => d.id === r.divisionId)
                return (
                  <button
                    key={r.id}
                    onMouseDown={() => {
                      sessionStorage.setItem('bpk-dashboard-selected-division', r.divisionId)
                      navigate(`/dashboard/division/${r.divisionId}`)
                      setSearch('')
                      setSearchOpen(false)
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-navy">{r.title}</span>
                    <span className="text-xs text-slate-400">
                      {div?.name || r.divisionId} &middot; {getDocumentCategory(r.divisionId, r.categoryId)?.name || r.categoryId}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-teal ring-2 ring-white" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            {notifications.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400">You're all caught up.</p>
            )}
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-md px-3 py-2 hover:bg-slate-50">
                  <p className="text-sm text-slate-700">{n.message}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatDate(n.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-50">
              <Avatar name={user?.name} size="sm" />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-700">{user?.name}</p>
                <Badge variant={roleInfo.variant} className="mt-0.5">
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
