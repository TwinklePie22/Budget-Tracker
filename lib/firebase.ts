import { initializeApp, getApps } from "firebase/app"
import { getAuth, initializeAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Lazy initialization - only called when actually needed
let auth: any = null
let db: any = null
let initialized = false

export function initializeFirebase() {
  if (initialized) return { auth, db }
  
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    initialized = true
    return { auth, db }
  } catch (error) {
    console.error("Failed to initialize Firebase:", error)
    return { auth: null, db: null }
  }
}

export { auth, db }
