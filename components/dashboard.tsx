"use client"

import type React from "react"
import { LogOut } from "lucide-react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Plus,
  Minus,
  FileText,
  Loader2,
  ShoppingBag,
  Utensils,
  Briefcase,
  Home,
  Wallet,
  Receipt,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Trash2,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import {
  type Category,
  type Transaction,
  type MonthData,
  CATEGORY_LABELS,
  getOrCreateMonth,
  addTransaction,
  deleteTransaction,
  subscribeToMonthData,
  subscribeToTransactions,
} from "@/lib/budget-service"

interface DashboardProps {
  userId: string
  monthYear: string
  displayMonth: string
  onBack: () => void
}

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  general: <Wallet className="w-5 h-5" />,
  shopping: <ShoppingBag className="w-5 h-5" />,
  outingFood: <Utensils className="w-5 h-5" />,
  office: <Briefcase className="w-5 h-5" />,
  homeAU: <Home className="w-5 h-5" />,
  homeAXIS: <Home className="w-5 h-5" />,
}

const CATEGORY_STYLES: Record<Category, { bg: string; icon: string; border: string; progress: string }> = {
  general: {
    bg: "bg-gradient-to-br from-blue-500/15 to-blue-600/5",
    icon: "bg-blue-500/20 text-blue-400",
    border: "border-blue-500/20 hover:border-blue-500/40",
    progress: "from-blue-500 to-blue-400",
  },
  shopping: {
    bg: "bg-gradient-to-br from-violet-500/15 to-violet-600/5",
    icon: "bg-violet-500/20 text-violet-400",
    border: "border-violet-500/20 hover:border-violet-500/40",
    progress: "from-violet-500 to-violet-400",
  },
  outingFood: {
    bg: "bg-gradient-to-br from-amber-500/15 to-amber-600/5",
    icon: "bg-amber-500/20 text-amber-400",
    border: "border-amber-500/20 hover:border-amber-500/40",
    progress: "from-amber-500 to-amber-400",
  },
  office: {
    bg: "bg-gradient-to-br from-cyan-500/15 to-cyan-600/5",
    icon: "bg-cyan-500/20 text-cyan-400",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    progress: "from-cyan-500 to-cyan-400",
  },
  homeAU: {
    bg: "bg-gradient-to-br from-indigo-500/15 to-indigo-600/5",
    icon: "bg-indigo-500/20 text-indigo-400",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    progress: "from-indigo-500 to-indigo-400",
  },
  homeAXIS: {
    bg: "bg-gradient-to-br from-sky-500/15 to-sky-600/5",
    icon: "bg-sky-500/20 text-sky-400",
    border: "border-sky-500/20 hover:border-sky-500/40",
    progress: "from-sky-500 to-sky-400",
  },
}

export function Dashboard({ userId, monthYear, displayMonth, onBack }: DashboardProps) {
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactions, setShowTransactions] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    getOrCreateMonth(userId, monthYear).then(() => {
      setLoading(false)
    })

    const unsubMonth = subscribeToMonthData(userId, monthYear, setMonthData)
    const unsubTransactions = subscribeToTransactions(userId, monthYear, setTransactions)

    return () => {
      unsubMonth()
      unsubTransactions()
    }
  }, [userId, monthYear])

  const handleAddTransaction = async (category: Category, amount: number, comment: string) => {
    if (!userId) return
    await addTransaction(userId, monthYear, {
      category,
      amount,
      type: "add",
      comment: comment || undefined,
    })
    setAddDialogOpen(false)
  }

  const handleRemoveTransaction = async (category: Category, amount: number, comment: string) => {
    if (!userId) return
    await addTransaction(userId, monthYear, {
      category,
      amount,
      type: "remove",
      comment: comment || undefined,
    })
    setRemoveDialogOpen(false)
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header with blue gradient effect
    doc.setFillColor(59, 130, 246) // blue-500
    doc.rect(0, 0, pageWidth, 50, "F")

    // Secondary header bar
    doc.setFillColor(37, 99, 235) // blue-600
    doc.rect(0, 42, pageWidth, 8, "F")

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("Budget Report", 14, 24)

    // Subtitle
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text(displayMonth, 14, 35)

    // Generated date - right aligned
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, pageWidth - 14, 35, {
      align: "right",
    })

    // Reset text color
    doc.setTextColor(30, 30, 30)

    // Summary Section Title
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text("FINANCIAL SUMMARY", 14, 62)

    // Total spent box with border
    doc.setFillColor(248, 250, 252) // slate-50
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.roundedRect(14, 66, pageWidth - 28, 30, 4, 4, "FD")

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text("Total Expenditure", 22, 78)

    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text(`Rs. ${monthData?.totalSpent?.toLocaleString() || 0}`, 22, 90)

    // Category Breakdown Title
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(100, 116, 139)
    doc.text("CATEGORY BREAKDOWN", 14, 112)

    // Category table
    const categoryData = Object.entries(monthData?.categories || {}).map(([cat, amount]) => {
      const total = monthData?.totalSpent || 1
      const percentage = ((amount / total) * 100).toFixed(1)
      return [CATEGORY_LABELS[cat as Category], `Rs. ${amount.toLocaleString()}`, `${percentage}%`]
    })

    autoTable(doc, {
      startY: 116,
      head: [["Category", "Amount", "% of Total"]],
      body: categoryData,
      theme: "plain",
      headStyles: {
        fillColor: [241, 245, 249], // slate-100
        textColor: [71, 85, 105], // slate-600
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: 8,
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 6,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
        2: { cellWidth: 40, halign: "right" },
      },
    })

    // Transaction History Title
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 160

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(100, 116, 139)
    doc.text("TRANSACTION HISTORY", 14, finalY + 18)

    // Transaction summary stats
    const addCount = transactions.filter((t) => t.type === "add").length
    const removeCount = transactions.filter((t) => t.type === "remove").length

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`${transactions.length} transactions (${addCount} additions, ${removeCount} deductions)`, 14, finalY + 26)

    // Transactions table
    const transactionData = transactions.map((t) => [
      t.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      CATEGORY_LABELS[t.category],
      t.type === "add" ? `+Rs. ${t.amount.toLocaleString()}` : `-Rs. ${t.amount.toLocaleString()}`,
      t.comment || "-",
    ])

    autoTable(doc, {
      startY: finalY + 30,
      head: [["Date", "Category", "Amount", "Note"]],
      body: transactionData,
      theme: "plain",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: 8,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 45 },
        2: { cellWidth: 38, halign: "right", fontStyle: "bold" },
        3: { cellWidth: 70 },
      },
      didParseCell: (data) => {
        // Color code amounts
        if (data.column.index === 2 && data.section === "body") {
          const text = data.cell.text[0] || ""
          if (text.startsWith("+")) {
            data.cell.styles.textColor = [34, 197, 94] // green-500
          } else if (text.startsWith("-")) {
            data.cell.styles.textColor = [239, 68, 68] // red-500
          }
        }
      },
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184) // slate-400
      doc.text(`Budget Tracker • Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
        align: "center",
      })
    }

    doc.save(`budget-report-${monthYear}.pdf`)
  }

  // Calculate stats
  const totalAdded = transactions.filter((t) => t.type === "add").reduce((sum, t) => sum + t.amount, 0)
  const totalRemoved = transactions.filter((t) => t.type === "remove").reduce((sum, t) => sum + t.amount, 0)

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!transaction.id) return

    setDeletingId(transaction.id)
    try {
      await deleteTransaction(userId, monthYear, transaction)
    } catch (error) {
      console.error("Failed to delete transaction:", error)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your budget...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{displayMonth}</h1>
              <p className="text-xs text-muted-foreground">Budget Overview</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total Spent - Full width */}
          <Card className="col-span-3 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6 pb-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary/70 text-xs font-semibold uppercase tracking-wider">Total Spent</p>
                  <p className="text-4xl font-bold text-foreground mt-1">
                    Rs. {monthData?.totalSpent?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Receipt className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Added */}
          <Card className="bg-card border-border hover:border-green-500/40 transition-colors group">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Added</p>
              <p className="text-xl font-bold text-green-400">+{totalAdded.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Removed */}
          <Card className="bg-card border-border hover:border-red-500/40 transition-colors group">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Removed</p>
              <p className="text-xl font-bold text-red-400">-{totalRemoved.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Transactions Count */}
          <Card className="bg-card border-border hover:border-primary/40 transition-colors group">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Entries</p>
              <p className="text-xl font-bold text-primary">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <TransactionDialog
            type="add"
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onSubmit={handleAddTransaction}
          />
          <TransactionDialog
            type="remove"
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onSubmit={handleRemoveTransaction}
          />
          <Button
            variant="outline"
            className="h-14 flex flex-col gap-1 border-border text-foreground bg-card hover:bg-secondary hover:border-primary/40 transition-all"
            onClick={generatePDF}
          >
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Export PDF</span>
          </Button>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spending by Category</h2>
          <div className="grid gap-3">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => {
              const amount = monthData?.categories?.[category] || 0
              const total = monthData?.totalSpent || 1
              const percentage = total > 0 ? (amount / total) * 100 : 0

              return (
                <Card
                  key={category}
                  className={`${CATEGORY_STYLES[category].bg} border ${CATEGORY_STYLES[category].border} transition-all cursor-default`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${CATEGORY_STYLES[category].icon}`}
                        >
                          {CATEGORY_ICONS[category]}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">{CATEGORY_LABELS[category]}</span>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground text-xl">Rs. {amount.toLocaleString()}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-secondary/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${CATEGORY_STYLES[category].progress} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Transactions - With Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Transactions
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTransactions(!showTransactions)}
              className="h-8 px-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              {showTransactions ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Hide</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="text-xs">Show</span>
                </>
              )}
            </Button>
          </div>

          {showTransactions && (
            <>
              {transactions.length === 0 ? (
                <Card className="bg-card border-border border-dashed">
                  <CardContent className="py-12 text-center">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-foreground font-medium">No transactions yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add your first expense to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 10).map((t) => (
                    <Card key={t.id} className="bg-card border-border hover:bg-secondary/30 transition-colors">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              t.type === "add" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {t.type === "add" ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{CATEGORY_LABELS[t.category]}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {t.comment && ` • ${t.comment}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${t.type === "add" ? "text-green-400" : "text-red-400"}`}>
                            {t.type === "add" ? "+" : "-"}Rs. {t.amount.toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteTransaction(t)}
                            disabled={deletingId === t.id}
                          >
                            {deletingId === t.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {transactions.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      Showing 10 of {transactions.length} transactions
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// Transaction Dialog Component
function TransactionDialog({
  type,
  open,
  onOpenChange,
  onSubmit,
}: {
  type: "add" | "remove"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (category: Category, amount: number, comment: string) => Promise<void>
}) {
  const [category, setCategory] = useState<Category>("general")
  const [amount, setAmount] = useState("")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    setLoading(true)
    await onSubmit(category, Number(amount), comment)
    setLoading(false)
    setAmount("")
    setComment("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`h-14 flex flex-col gap-1 border-border text-foreground bg-card transition-all ${
            type === "add"
              ? "hover:bg-green-500/10 hover:border-green-500/40"
              : "hover:bg-red-500/10 hover:border-red-500/40"
          }`}
        >
          {type === "add" ? <Plus className="w-5 h-5 text-green-400" /> : <Minus className="w-5 h-5 text-red-400" />}
          <span className="text-xs font-medium">{type === "add" ? "Add" : "Remove"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">{type === "add" ? "Add Transaction" : "Remove Amount"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {type === "add" ? "Record a new expense" : "Deduct from a category"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-foreground">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Amount (Rs.)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Note (optional)</Label>
            <Textarea
              placeholder="Add a note..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={2}
            />
          </div>
          <Button
            type="submit"
            className={`w-full h-12 font-medium ${
              type === "add" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {type === "add" ? "Add Transaction" : "Remove Amount"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
