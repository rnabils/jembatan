import { useMemo, useState } from 'react'
import { Mail, Briefcase, ShieldCheck, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { formatDate } from '../lib/utils'
import { getRoleInfo } from '../data/accessControl'

export default function Profile() {
  const { user, roleInfo, updateProfile } = useAuth()
  const { content, divisions } = useData()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)

  const mySubmissions = useMemo(() => {
    return content
      .filter((c) => c.author === user?.name)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [content, user])

  const division = divisions.find((d) => d.id === user?.division)

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile({ name, email })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account details and view your submissions.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar name={user?.name} size="lg" />
            <p className="mt-4 text-lg font-semibold text-navy">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.position}</p>
            <Badge variant={roleInfo.variant} className="mt-3">
              {roleInfo.label}
            </Badge>

            <div className="mt-6 w-full space-y-3 border-t border-slate-100 pt-4 text-left">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-teal" /> {user?.email}
              </div>
              {division && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase className="h-4 w-4 text-teal" /> {division.name}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="h-4 w-4 text-teal" /> {roleInfo.label} access
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Update your basic profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="teal">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
                {saved && <span className="text-sm text-emerald-600">Saved successfully.</span>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {user?.role !== 'viewer' && (
        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
            <CardDescription>Track the review status of content you've submitted</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {mySubmissions.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-slate-400">You haven't submitted any content yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {mySubmissions.map((item) => {
                  const div = divisions.find((d) => d.id === item.division)
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{item.title}</p>
                        <p className="text-xs text-slate-400">
                          {div?.name} &middot; {item.type} &middot; {formatDate(item.date)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'approved'
                            ? 'success'
                            : item.status === 'rejected'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {item.status === 'approved'
                          ? 'Approved'
                          : item.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
