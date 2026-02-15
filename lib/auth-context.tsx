"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { initializeFirebase } from "./firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

interface FallbackUser extends User {
  uid: string
  email: string
  displayName?: string
  emailVerified: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Fallback auth for when Firebase is not configured
function useFallbackAuth() {
  const [user, setUser] = useState<FallbackUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is stored in session storage (fallback)
    const storedUser = sessionStorage.getItem("fallback_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Fallback auth - simple demo auth
    const user: FallbackUser = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split("@")[0],
      emailVerified: false,
      metadata: {},
      isAnonymous: false,
      providerData: [],
      reload: async () => {},
      getIdToken: async () => "token",
      getIdTokenResult: async () => ({ token: "token", claims: {}, signInProvider: null, signInTime: new Date().toISOString(), issuedAtTime: new Date().toISOString(), expirationTime: new Date().toISOString() }),
      toJSON: () => ({}),
      delete: async () => {},
      phoneNumber: null,
      photoURL: null,
    }
    sessionStorage.setItem("fallback_user", JSON.stringify(user))
    setUser(user)
  }

  const signUp = async (email: string, password: string) => {
    await signIn(email, password)
  }

  const signOut = async () => {
    sessionStorage.removeItem("fallback_user")
    setUser(null)
  }

  return { user, loading, signIn, signUp, signOut }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState<any>(null)
  const [useFirebase, setUseFirebase] = useState(true)
  const fallbackAuth = useFallbackAuth()

  useEffect(() => {
    try {
      const { auth: firebaseAuth } = initializeFirebase()
      
      if (!firebaseAuth) {
        console.warn("Firebase not configured. Using fallback authentication.")
        setUseFirebase(false)
        setLoading(false)
        return
      }

      setUseFirebase(true)
      setAuth(firebaseAuth)
      
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        setUser(user)
        setLoading(false)
      })
      
      return () => unsubscribe()
    } catch (err) {
      console.warn("Firebase initialization failed. Using fallback authentication.", err)
      setUseFirebase(false)
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (useFirebase && auth) {
      await signInWithEmailAndPassword(auth, email, password)
    } else {
      await fallbackAuth.signIn(email, password)
      setUser(fallbackAuth.user)
    }
  }

  const signUp = async (email: string, password: string) => {
    if (useFirebase && auth) {
      await createUserWithEmailAndPassword(auth, email, password)
    } else {
      await fallbackAuth.signUp(email, password)
      setUser(fallbackAuth.user)
    }
  }

  const signOut = async () => {
    if (useFirebase && auth) {
      await firebaseSignOut(auth)
    } else {
      await fallbackAuth.signOut()
      setUser(null)
    }
  }

  const currentUser = useFirebase ? user : fallbackAuth.user
  const currentLoading = useFirebase ? loading : fallbackAuth.loading

  return <AuthContext.Provider value={{ user: currentUser, loading: currentLoading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
