import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "./firebase"

export type Category = "general" | "shopping" | "outingFood" | "office" | "homeAU" | "homeAXIS"

export interface Transaction {
  id?: string
  amount: number
  category: Category
  type: "add" | "remove"
  comment?: string
  createdAt: Date
}

export interface MonthData {
  totalSpent: number
  categories: Record<Category, number>
}

const CATEGORY_DEFAULTS: Record<Category, number> = {
  general: 0,
  shopping: 0,
  outingFood: 0,
  office: 0,
  homeAU: 0,
  homeAXIS: 0,
}

export const CATEGORY_LABELS: Record<Category, string> = {
  general: "General",
  shopping: "Shopping",
  outingFood: "Outing & Food",
  office: "Office",
  homeAU: "Home (AU)",
  homeAXIS: "Home (AXIS)",
}

// In-memory fallback storage when Firebase is not available
const fallbackStore: Map<string, Map<string, { monthData: MonthData; transactions: Transaction[] }>> = new Map()
const listeners: Map<string, Set<Function>> = new Map()

function getFallbackKey(userId: string, monthYear: string): string {
  return `${userId}:${monthYear}`
}

function notifyListeners(key: string) {
  const callbacks = listeners.get(key)
  if (callbacks) {
    callbacks.forEach((cb) => cb())
  }
}

export async function getOrCreateMonth(userId: string, monthYear: string): Promise<MonthData> {
  // If Firestore is not available, use fallback
  if (!db) {
    const key = getFallbackKey(userId, monthYear)
    if (!fallbackStore.has(userId)) {
      fallbackStore.set(userId, new Map())
    }

    const userStore = fallbackStore.get(userId)!
    if (!userStore.has(monthYear)) {
      userStore.set(monthYear, {
        monthData: {
          totalSpent: 0,
          categories: { ...CATEGORY_DEFAULTS },
        },
        transactions: [],
      })
    }

    return userStore.get(monthYear)!.monthData
  }

  // Firebase path
  const monthRef = doc(db, "users", userId, "months", monthYear)
  const monthSnap = await getDoc(monthRef)

  if (monthSnap.exists()) {
    return monthSnap.data() as MonthData
  }

  const newMonth: MonthData = {
    totalSpent: 0,
    categories: { ...CATEGORY_DEFAULTS },
  }

  await setDoc(monthRef, newMonth)
  return newMonth
}

export async function addTransaction(
  userId: string,
  monthYear: string,
  transaction: Omit<Transaction, "id" | "createdAt">,
): Promise<void> {
  // If Firestore is not available, use fallback
  if (!db) {
    const userStore = fallbackStore.get(userId)
    if (!userStore) return

    const data = userStore.get(monthYear)
    if (!data) return

    const newTransaction: Transaction = {
      id: `trans_${Date.now()}_${Math.random()}`,
      ...transaction,
      createdAt: new Date(),
    }

    data.transactions.unshift(newTransaction)

    // Update totals
    const amountChange = transaction.type === "add" ? transaction.amount : -transaction.amount
    data.monthData.totalSpent += amountChange
    data.monthData.categories[transaction.category] += amountChange

    notifyListeners(getFallbackKey(userId, monthYear))
    return
  }

  // Firebase path
  const monthRef = doc(db, "users", userId, "months", monthYear)
  const transactionsRef = collection(monthRef, "transactions")

  const transactionData: Record<string, unknown> = {
    amount: transaction.amount,
    category: transaction.category,
    type: transaction.type,
    createdAt: serverTimestamp(),
  }

  // Only add comment if it exists and is not empty
  if (transaction.comment && transaction.comment.trim() !== "") {
    transactionData.comment = transaction.comment
  }

  // Add transaction
  await addDoc(transactionsRef, transactionData)

  // Update totals
  const amountChange = transaction.type === "add" ? transaction.amount : -transaction.amount

  await updateDoc(monthRef, {
    totalSpent: increment(amountChange),
    [`categories.${transaction.category}`]: increment(amountChange),
  })
}

export function subscribeToMonthData(
  userId: string,
  monthYear: string,
  callback: (data: MonthData) => void,
): Unsubscribe {
  // If Firestore is not available, use fallback
  if (!db) {
    const key = getFallbackKey(userId, monthYear)

    // Call immediately with current data
    const userStore = fallbackStore.get(userId)
    if (userStore) {
      const data = userStore.get(monthYear)
      if (data) {
        callback(data.monthData)
      }
    }

    // Register listener
    if (!listeners.has(key)) {
      listeners.set(key, new Set())
    }
    listeners.get(key)!.add(callback)

    // Return unsubscribe function
    return () => {
      const cbs = listeners.get(key)
      if (cbs) {
        cbs.delete(callback)
      }
    }
  }

  // Firebase path
  const monthRef = doc(db, "users", userId, "months", monthYear)

  return onSnapshot(monthRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as MonthData)
    } else {
      callback({
        totalSpent: 0,
        categories: { ...CATEGORY_DEFAULTS },
      })
    }
  })
}

export function subscribeToTransactions(
  userId: string,
  monthYear: string,
  callback: (transactions: Transaction[]) => void,
): Unsubscribe {
  // If Firestore is not available, use fallback
  if (!db) {
    const key = getFallbackKey(userId, monthYear)

    // Call immediately with current data
    const userStore = fallbackStore.get(userId)
    if (userStore) {
      const data = userStore.get(monthYear)
      if (data) {
        callback(data.transactions)
      }
    }

    // Register listener
    if (!listeners.has(key)) {
      listeners.set(key, new Set())
    }
    listeners.get(key)!.add(callback)

    // Return unsubscribe function
    return () => {
      const cbs = listeners.get(key)
      if (cbs) {
        cbs.delete(callback)
      }
    }
  }

  // Firebase path
  const monthRef = doc(db, "users", userId, "months", monthYear)
  const transactionsRef = collection(monthRef, "transactions")
  const q = query(transactionsRef, orderBy("createdAt", "desc"))

  return onSnapshot(q, (snap) => {
    const transactions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Transaction[]
    callback(transactions)
  })
}
