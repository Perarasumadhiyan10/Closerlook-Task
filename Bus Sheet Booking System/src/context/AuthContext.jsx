import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/firebase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile = null
        try { const snap = await getDoc(doc(db, 'users', firebaseUser.uid)); profile = snap.exists() ? snap.data() : null } catch {}
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: profile?.name || firebaseUser.displayName || 'BusGo User', mobile: profile?.mobile || '', role: profile?.role || 'passenger' })
      } else setUser(null)
      setLoading(false)
    })
  }, [])

  const signOut = () => firebaseSignOut(auth)
  return <AuthContext.Provider value={{ user, loading, signOut, isFirebaseConfigured }}>{children}</AuthContext.Provider>
}
