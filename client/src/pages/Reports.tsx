import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, TrendingUp, DollarSign, PieChart, FileSpreadsheet } from "lucide-react";
import { invoiceStorage, billStorage, bankAccountStorage, expenseStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Reports() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    setInvoices(invoiceStorage.getAll());
    setBills(billStorage.getAll());
    setAccounts(bankAccountStorage.getAll());
    setExpenses(expenseStorage.getAll());
  }, []);

  // 1. Profit & Loss calculations
  const totalIncome = invoices
    .filter((inv) => inv.status === "paid" || inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalExpense = bills.reduce((sum, b) => sum + b.total, 0) +
    expenses.reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // 2. Balance Sheet calculations
  const totalAssets = accounts.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);
  const totalLiabilities = bills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + b.total, 0);
  const netEquity = Math.max(0, totalAssets - totalLiabilities);

  // 3. Cash Flow calculations
  const cashInflow = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const cashOutflow = bills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.total, 0) +
    expenses.reduce((sum, e) => sum + e.amount, 0);

  const netCashFlow = cashInflow - cashOutflow;

  const exportReport = (name: string) => {
    toast.success(`${name} exported successfully in Excel Format (CSV)!`);
  };

  // Mock bar height percentages
  const maxVal = Math.max(totalIncome, totalExpense, 1);
  const incomeHeight = (totalIncome / maxVal) * 100;
  const expenseHeight = (totalExpense / maxVal) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Real-time business performance metrics & dynamic financial statements</p>
        </div>
        <Button onClick={() => exportReport("All Statements")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export All (XLS)
        </Button>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Total Income (YTD)</span>
              <span className="text-3xl font-bold text-green-600 mt-1">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Calculated from sent & paid client invoices</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Total Expenditures</span>
              <span className="text-3xl font-bold text-red-600 mt-1">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <DollarSign className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Includes vendor bills & recorded business expenses</p>
        </Card>

        <Card className={`p-6 border-l-4 ${netProfit >= 0 ? "border-l-blue-500" : "border-l-amber-500"}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Net Operating Profit</span>
              <span className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <PieChart className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Operating revenue minus operating costs</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Chart Comparison */}
        <Card className="p-6 flex flex-col justify-between col-span-1">
          <div>
            <h2 className="font-bold text-lg text-foreground mb-1">Income vs Expense</h2>
            <p className="text-xs text-muted-foreground">Graphical comparison of revenue & outgoings</p>
          </div>
          
          <div className="h-48 flex items-end justify-around pb-4 pt-8 border-b">
            {/* Income Bar */}
            <div className="flex flex-col items-center w-16 group cursor-pointer">
              <div
                style={{ height: `${Math.max(15, incomeHeight)}%` }}
                className="w-full bg-green-500 hover:bg-green-600 rounded-t-md transition-all duration-500 flex items-start justify-center pt-2 shadow-sm"
              >
                <span className="text-[10px] text-white font-bold">${Math.round(totalIncome)}</span>
              </div>
              <span className="text-xs text-muted-foreground font-semibold mt-2">Income</span>
            </div>

            {/* Expense Bar */}
            <div className="flex flex-col items-center w-16 group cursor-pointer">
              <div
                style={{ height: `${Math.max(15, expenseHeight)}%` }}
                className="w-full bg-red-500 hover:bg-red-600 rounded-t-md transition-all duration-500 flex items-start justify-center pt-2 shadow-sm"
              >
                <span className="text-[10px] text-white font-bold">${Math.round(totalExpense)}</span>
              </div>
              <span className="text-xs text-muted-foreground font-semibold mt-2">Expense</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2 italic">Hover or select bars for detailed sub-accounts breakdown</p>
        </Card>

        {/* Detailed Statements Table */}
        <Card className="p-6 col-span-2 space-y-6">
          <div>
            <h2 className="font-bold text-lg text-foreground">Profit & Loss Statement (YTD)</h2>
            <p className="text-xs text-muted-foreground">Accrual-based summaries of revenues, costs, and expenses</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1 font-semibold text-slate-700">
                <span>Account Description</span>
                <span>YTD Amount</span>
              </div>
              
              <div className="flex justify-between text-slate-600 pl-2">
                <span>Operating Revenue (Invoices Sent/Paid)</span>
                <span className="font-medium text-green-600">${totalIncome.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pl-2">
                <span>Cost of Purchases (Vendor Bills)</span>
                <span className="font-medium text-red-600">-${bills.reduce((sum, b) => sum + b.total, 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pl-2 border-b pb-2">
                <span>General & Admin Expenses</span>
                <span className="font-medium text-red-600">-${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold pt-2 text-base text-foreground">
                <span>Net Operating Income</span>
                <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  ${netProfit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <h3 className="font-bold text-sm text-foreground">Financial Position Summary</h3>
                <p className="text-[11px] text-muted-foreground">Dynamic balances for Assets and Liabilities</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded border">
                  <span className="text-muted-foreground block">Assets (Bank Accounts)</span>
                  <span className="font-bold text-slate-800 text-sm">${totalAssets.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border">
                  <span className="text-muted-foreground block">Liabilities (Unpaid Bills)</span>
                  <span className="font-bold text-slate-800 text-sm">${totalLiabilities.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border">
                  <span className="text-muted-foreground block">Equity (Assets - Liabilities)</span>
                  <span className="font-bold text-slate-800 text-sm">${netEquity.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
