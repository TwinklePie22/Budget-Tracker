"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState<any>(null)

  useEffect(() => {
    // Dynamically import Firebase to ensure environment variables are available
    import("./firebase").then(({ auth: firebaseAuth }) => {
      if (!firebaseAuth) {
        console.error("Firebase auth not initialized - check your environment variables")
        setLoading(false)
        return
      }

      setAuth(firebaseAuth)
      
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        setUser(user)
        setLoading(false)
      })
      
      return () => unsubscribe()
    }).catch((error) => {
      console.error("Failed to load Firebase:", error)
      setLoading(false)
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    if (!auth) throw new Error("Firebase not initialized")
    await firebaseSignOut(auth)
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
