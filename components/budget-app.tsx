"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthForm } from "./auth-form"
import { MonthSelector } from "./month-selector"
import { Dashboard } from "./dashboard"
import { Loader2 } from "lucide-react"

type Screen = "month-select" | "dashboard"

export function BudgetApp() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState<Screen>("month-select")
  const [selectedMonth, setSelectedMonth] = useState("January")

  const monthYear = `${selectedMonth.toLowerCase()}-2026`
  const displayMonth = selectedMonth // Just the month name, no year

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (screen === "month-select") {
    return (
      <MonthSelector
        onMonthSelect={(month) => {
          setSelectedMonth(month)
          setScreen("dashboard")
        }}
      />
    )
  }

  return <Dashboard monthYear={monthYear} displayMonth={displayMonth} onBack={() => setScreen("month-select")} />
}
