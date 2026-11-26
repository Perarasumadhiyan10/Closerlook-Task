import { Navigate } from 'react-router-dom'
import { getConductorSession } from '../services/conductorAuth'

export default function ConductorRoute({ children }) {
  const session = getConductorSession()
  if (!session) return <Navigate to="/conductor-login" replace />
  return children
}
