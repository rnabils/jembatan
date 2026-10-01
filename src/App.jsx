import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'

const Landing = lazy(() => import('./pages/Landing'))
const TransitionToDashboard = lazy(() => import('./pages/TransitionToDashboard'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DivisionWorkspace = lazy(() => import('./pages/DivisionWorkspace'))
const Approvals = lazy(() => import('./pages/Approvals'))
const Profile = lazy(() => import('./pages/Profile'))
const KondisiPegawaiPage = lazy(() => import('./pages/KondisiPegawaiPage'))
const SharedCalendar = lazy(() => import('./pages/SharedCalendar'))
const ServiceMonitoring = lazy(() => import('./pages/ServiceMonitoring'))
const Reports = lazy(() => import('./pages/Reports'))
const SystemGuide = lazy(() => import('./pages/SystemGuide'))
const NotFound = lazy(() => import('./pages/NotFound'))

function LegacyDivisionRedirect() {
  const { divisionId } = useParams()
  return <Navigate to={`/dashboard/division/${divisionId}`} replace />
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route
          path="/transition"
          element={
            <ProtectedRoute>
              <TransitionToDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transition-to-dashboard"
          element={
            <ProtectedRoute>
              <TransitionToDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Landing />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/division/:divisionId" element={<DivisionWorkspace />} />
          <Route path="/dashboard/division/:divisionId/bezetting/:documentId" element={<KondisiPegawaiPage />} />
          <Route path="/division/:divisionId" element={<LegacyDivisionRedirect />} />
          <Route path="/dashboard/kalender" element={<SharedCalendar />} />
          <Route path="/dashboard/monitoring" element={<ServiceMonitoring />} />
          <Route path="/dashboard/laporan" element={<Reports />} />
          <Route path="/dashboard/panduan" element={<SystemGuide />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute roles={['admin']}>
                <Approvals />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
