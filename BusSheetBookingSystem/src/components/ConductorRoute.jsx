import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ConductorRoute({children}){const {user,loading}=useAuth();if(loading)return <div className="page-loading">Loading…</div>;if(!user)return <Navigate to="/conductor-login" replace />;return user.role==='conductor'?children:<Navigate to="/conductor-login" replace />}
