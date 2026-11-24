import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/firebase'

const configurationError = () => new Error('Firebase is not configured. Add your Firebase values to the .env file and restart the development server.')

export async function registerUser({ name, email, mobile, password }) {
  if (!isFirebaseConfigured || !auth || !db) throw configurationError()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  await setDoc(doc(db, 'users', credential.user.uid), { uid: credential.user.uid, name, email, mobile, role: 'passenger', createdAt: serverTimestamp() })
  return credential.user
}

export async function loginUser(email, password) {
  if (!isFirebaseConfigured || !auth) throw configurationError()
  return signInWithEmailAndPassword(auth, email, password)
}

export async function resetPassword(email) {
  if (!isFirebaseConfigured || !auth) throw configurationError()
  return sendPasswordResetEmail(auth, email)
}
