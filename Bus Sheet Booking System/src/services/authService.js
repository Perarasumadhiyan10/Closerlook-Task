import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

export async function registerUser({ name, email, mobile, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  await setDoc(doc(db, 'users', credential.user.uid), { uid: credential.user.uid, name, email, mobile, role: 'passenger', createdAt: serverTimestamp() })
  return credential.user
}
export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password)
export const resetPassword = (email) => sendPasswordResetEmail(auth, email)
