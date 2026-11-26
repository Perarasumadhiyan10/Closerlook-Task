const CONDUCTOR_SESSION_KEY = 'busgo_conductor_session'
const REGISTERED_CONDUCTORS_KEY = 'busgo_registered_conductors'

const DEFAULT_CONDUCTOR_EMAIL =
  import.meta.env.VITE_CONDUCTOR_EMAIL ||
  import.meta.env.VITE_CONDUCTOR_ID ||
  'conductor@busgo.in'
const DEFAULT_CONDUCTOR_PASSWORD =
  import.meta.env.VITE_CONDUCTOR_PASSWORD || 'conductor123'

function readRegisteredConductors() {
  try {
    const raw = localStorage.getItem(REGISTERED_CONDUCTORS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRegisteredConductors(list) {
  localStorage.setItem(REGISTERED_CONDUCTORS_KEY, JSON.stringify(list))
}

function createSession(conductor) {
  const session = {
    name: conductor.name || 'Conductor',
    conductorEmail: conductor.email,
    conductorId: conductor.badgeId || conductor.email,
    mobile: conductor.mobile || '',
    badgeId: conductor.badgeId || '',
    role: 'conductor',
    loggedInAt: Date.now(),
  }
  localStorage.setItem(CONDUCTOR_SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Registers a new conductor account for the separate Conductor Panel
 * and starts an active conductor session.
 */
export function registerConductor({ name, email, mobile, badgeId, password }) {
  const cleanName = String(name || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanMobile = String(mobile || '').trim()
  const cleanBadgeId = String(badgeId || '').trim()
  const cleanPassword = String(password || '')

  if (!cleanName || !cleanEmail || !cleanMobile || !cleanPassword) {
    throw new Error('Please fill in all required conductor details.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Enter a valid email address.')
  }
  if (!/^\d{10}$/.test(cleanMobile)) {
    throw new Error('Enter a valid 10-digit mobile number.')
  }
  if (cleanPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  const existing = readRegisteredConductors()
  if (
    cleanEmail === DEFAULT_CONDUCTOR_EMAIL.toLowerCase() ||
    existing.some((c) => c.email.toLowerCase() === cleanEmail)
  ) {
    throw new Error('This conductor email ID is already registered.')
  }

  const newConductor = {
    name: cleanName,
    email: cleanEmail,
    mobile: cleanMobile,
    badgeId: cleanBadgeId,
    password: cleanPassword,
    role: 'conductor',
    createdAt: Date.now(),
  }
  saveRegisteredConductors([...existing, newConductor])
  return createSession(newConductor)
}

/**
 * Authenticates a conductor using either a registered conductor account or
 * the default conductor panel credentials, separate from passenger auth.
 */
export function loginConductor(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPassword = String(password || '')

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Enter both Conductor Email ID and Password.')
  }

  const registered = readRegisteredConductors()
  const matchedRegistered = registered.find(
    (c) => c.email.toLowerCase() === cleanEmail && c.password === cleanPassword
  )

  if (matchedRegistered) {
    return createSession(matchedRegistered)
  }

  if (
    cleanEmail === DEFAULT_CONDUCTOR_EMAIL.toLowerCase() &&
    cleanPassword === DEFAULT_CONDUCTOR_PASSWORD
  ) {
    return createSession({
      name: 'BusGo Conductor',
      email: DEFAULT_CONDUCTOR_EMAIL,
      badgeId: 'COND001',
    })
  }

  throw new Error('Invalid Conductor Email ID or Password.')
}

/**
 * Returns the active conductor session if signed in, otherwise null.
 */
export function getConductorSession() {
  try {
    const raw = localStorage.getItem(CONDUCTOR_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.role === 'conductor' && (parsed?.conductorEmail || parsed?.conductorId)
      ? parsed
      : null
  } catch {
    return null
  }
}

/**
 * Clears the active conductor panel session without affecting passenger login.
 */
export function logoutConductor() {
  localStorage.removeItem(CONDUCTOR_SESSION_KEY)
}

export function getConductorCredentialsHint() {
  return {
    email: DEFAULT_CONDUCTOR_EMAIL,
    password: DEFAULT_CONDUCTOR_PASSWORD,
  }
}
