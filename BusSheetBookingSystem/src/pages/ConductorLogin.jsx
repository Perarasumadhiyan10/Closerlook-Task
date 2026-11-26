import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BadgeCheck, Mail, LockKeyhole, ShieldCheck } from 'lucide-react'
import {
  getConductorCredentialsHint,
  getConductorSession,
  loginConductor,
} from '../services/conductorAuth'

export default function ConductorLogin() {
  const navigate = useNavigate()
  const existingSession = getConductorSession()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (existingSession) {
    return <Navigate to="/conductor" replace />
  }

  const hint = getConductorCredentialsHint()
  const showDefaultHint =
    !import.meta.env.VITE_CONDUCTOR_EMAIL && !import.meta.env.VITE_CONDUCTOR_ID

  const submit = (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      loginConductor(form.email, form.password)
      navigate('/conductor', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="conductor-auth-page">
      <div className="auth-card conductor-auth-card">
        <div className="conductor-panel-badge">
          <BadgeCheck size={18} />
          <span>CONDUCTOR PANEL</span>
        </div>
        <h1>Conductor Sign In</h1>
        <p>
          Sign in with your dedicated conductor email ID and password to verify passenger QR tickets.
        </p>

        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Conductor Email ID</span>
            <div>
              <Mail size={18} />
              <input
                type="email"
                placeholder="Enter conductor email ID"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div>
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-btn" disabled={busy}>
            {busy ? 'Verifying…' : 'Open Conductor Panel'}
          </button>
        </form>

        {showDefaultHint && (
          <div className="conductor-credentials-hint">
            <ShieldCheck size={16} />
            <span>
              Email ID: <b>{hint.email}</b> · Password: <b>{hint.password}</b>
            </span>
          </div>
        )}

        <div className="auth-links">
          <span>
            New conductor? <Link to="/conductor-register">Register conductor details</Link>
          </span>
        </div>
      </div>
    </main>
  )
}
