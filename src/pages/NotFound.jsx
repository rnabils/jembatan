import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <AlertTriangle className="mb-4 h-14 w-14 text-teal" />
      <h1 className="text-3xl font-bold text-navy">404</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
      <Button variant="teal" className="mt-6" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
