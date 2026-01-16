"use client"

import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const MONTHS = [
  { name: "January", short: "Jan", num: "01" },
  { name: "February", short: "Feb", num: "02" },
  { name: "March", short: "Mar", num: "03" },
  { name: "April", short: "Apr", num: "04" },
  { name: "May", short: "May", num: "05" },
  { name: "June", short: "Jun", num: "06" },
  { name: "July", short: "Jul", num: "07" },
  { name: "August", short: "Aug", num: "08" },
  { name: "September", short: "Sep", num: "09" },
  { name: "October", short: "Oct", num: "10" },
  { name: "November", short: "Nov", num: "11" },
  { name: "December", short: "Dec", num: "12" },
]

interface MonthSelectorProps {
  onMonthSelect: (month: string) => void
}

export function MonthSelector({ onMonthSelect }: MonthSelectorProps) {
  const currentMonth = new Date().getMonth()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-1">Budget Tracker</h1>
          <p className="text-muted-foreground">Select a month to track your expenses</p>
        </div>

        {/* Month Grid - Calendar Style */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-2xl shadow-black/20">
          <div className="grid grid-cols-3 gap-3">
            {MONTHS.map((month, index) => {
              const isCurrentMonth = index === currentMonth

              return (
                <button
                  key={month.name}
                  onClick={() => onMonthSelect(month.name)}
                  className={cn(
                    "relative py-5 px-3 rounded-xl transition-all text-center group",
                    "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                    "border border-transparent",
                    isCurrentMonth
                      ? "bg-primary/10 border-primary/30 text-foreground"
                      : "bg-secondary/50 text-foreground hover:bg-secondary hover:border-border",
                  )}
                >
                  {/* Month number badge */}
                  <span className="absolute top-2 left-2 text-[10px] font-medium text-muted-foreground">
                    {month.num}
                  </span>

                  {/* Current month indicator */}
                  {isCurrentMonth && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />}

                  <span className="block text-lg font-semibold">{month.short}</span>
                  <span className="block text-xs mt-0.5 text-muted-foreground">{month.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">Click on a month to view or add transactions</p>
      </div>
    </div>
  )
}
