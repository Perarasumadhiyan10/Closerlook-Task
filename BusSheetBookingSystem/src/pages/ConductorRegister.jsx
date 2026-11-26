import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  User,
  Mail,
  Smartphone,
  IdCard,
  LockKeyhole,
} from 'lucide-react'
import { getConductorSession, registerConductor } from '../services/conductorAuth'

export default function ConductorRegister() {
  const navigate = useNavigate()
  const existingSession = getConductorSession()
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    badgeId: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (existingSession) {
    return <Navigate to="/conductor" replace />
  }

  const submit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      registerConductor(form)
      navigate('/conductor', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to register conductor.')
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
        <h1>Register Conductor</h1>
        <p>Create your conductor account to access the ticket verification panel.</p>

        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Full name</span>
            <div>
              <User size={18} />
              <input
                type="text"
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </label>

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
            <span>Mobile number</span>
            <div>
              <Smartphone size={18} />
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Conductor ID / Badge No. (optional)</span>
            <div>
              <IdCard size={18} />
              <input
                type="text"
                placeholder="e.g. COND-102"
                value={form.badgeId}
                onChange={(e) => setForm({ ...form, badgeId: e.target.value })}
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div>
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Confirm password</span>
            <div>
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-btn" disabled={busy}>
            {busy ? 'Registering…' : 'Register & Open Panel'}
          </button>
        </form>

        <div className="auth-links">
          <span>
            Already registered? <Link to="/conductor-login">Conductor Sign In</Link>
          </span>
        </div>
      </div>
    </main>
  )
}
