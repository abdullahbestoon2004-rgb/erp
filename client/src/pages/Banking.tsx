import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Landmark, Plus, Rss, Tag, CheckSquare, Sparkles, Check, CheckCircle2 } from "lucide-react";
import { BankAccount, BankTransaction, Invoice, Bill } from "@/types";
import { bankAccountStorage, bankTransactionStorage, invoiceStorage, billStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Banking() {
  const [location, navigate] = useLocation();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  // Form states
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<"Checking" | "Savings" | "Credit Card">("Checking");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [balance, setBalance] = useState("");

  // Categorize / Match State
  const [selectedTxn, setSelectedTxn] = useState<BankTransaction | null>(null);
  const [isMatchOpen, setIsMatchOpen] = useState(false);

  // Reconciliation State
  const [reconciledMonths, setReconciledMonths] = useState<string[]>([]);
  const [selectedReconciledMonth, setSelectedReconciledMonth] = useState("June 2026");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccounts(bankAccountStorage.getAll());
    setTransactions(bankTransactionStorage.getAll());
    setInvoices(invoiceStorage.getAll());
    setBills(billStorage.getAll());
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountNumber || !bankName || !balance) {
      toast.error("Please fill in all required fields");
      return;
    }

    bankAccountStorage.add({
      accountName,
      accountType,
      accountNumber,
      bankName,
      balance: parseFloat(balance) || 0,
    });

    toast.success("Bank account added successfully");
    loadData();
    setIsAccountFormOpen(false);
    // Reset Form
    setAccountName("");
    setAccountNumber("");
    setBankName("");
    setBalance("");
  };

  const handleMatchTransaction = (txn: BankTransaction, docId: string, docType: "Invoice" | "Bill") => {
    // Perform matching logic
    if (docType === "Invoice") {
      const inv = invoices.find(i => i.id === docId);
      if (inv) {
        invoiceStorage.update(docId, { status: "paid" });
        bankTransactionStorage.update(txn.id, {
          status: "matched",
          matchedDocumentId: docId,
          matchedDocumentType: "Invoice",
          category: "Accounts Receivable"
        });
        toast.success(`Matched transaction to Invoice ${inv.invoiceNumber}`);
      }
    } else {
      const b = bills.find(x => x.id === docId);
      if (b) {
        billStorage.update(docId, { status: "paid" });
        bankTransactionStorage.update(txn.id, {
          status: "matched",
          matchedDocumentId: docId,
          matchedDocumentType: "Bill",
          category: "Accounts Payable"
        });
        toast.success(`Matched transaction to Bill ${b.billNumber}`);
      }
    }
    setIsMatchOpen(false);
    setSelectedTxn(null);
    loadData();
  };

  const handleQuickCategorize = (txn: BankTransaction, category: string) => {
    bankTransactionStorage.update(txn.id, {
      status: "categorized",
      category
    });
    toast.success(`Categorized transaction under ${category}`);
    loadData();
  };

  const handleReconcile = () => {
    if (reconciledMonths.includes(selectedReconciledMonth)) {
      toast.info("This month has already been reconciled.");
      return;
    }
    setReconciledMonths([...reconciledMonths, selectedReconciledMonth]);
    toast.success(`Month ${selectedReconciledMonth} reconciled successfully! All audit logs finalized.`);
  };

  // Determine active tab based on location
  const getActiveTab = () => {
    if (location === "/banking/feeds") return "feeds";
    if (location === "/banking/categorize") return "categorize";
    if (location === "/banking/reconciliation") return "reconciliation";
    return "accounts";
  };

  const activeTab = getActiveTab();

  const renderTabs = () => {
    const tabs = [
      { id: "accounts", label: "Bank Accounts", path: "/banking", icon: Landmark },
      { id: "feeds", label: "Bank Feeds", path: "/banking/feeds", icon: Rss },
      { id: "categorize", label: "Match & Categorize", path: "/banking/categorize", icon: Tag },
      { id: "reconciliation", label: "Reconciliation", path: "/banking/reconciliation", icon: CheckSquare },
    ];

    return (
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-foreground">Banking</h1>
        <p className="text-muted-foreground mt-1">Manage bank accounts, transaction matching, & bank reconciliations</p>
      </div>

      {renderTabs()}

      {/* BANK ACCOUNTS TAB */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Configured Bank Accounts</h2>
            <Dialog open={isAccountFormOpen} onOpenChange={setIsAccountFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              </DialogTrigger>
              <DialogContent fullScreen>
                <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
                  <DialogTitle className="text-xl font-display font-bold">Add New Bank Account</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/20">
                  <div className="max-w-3xl mx-auto bg-card p-8 rounded-xl border border-border shadow-sm">
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <Label>Account Name *</Label>
                    <Input placeholder="E.g., SVB Primary Checking" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Type</Label>
                      <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Checking">Checking</SelectItem>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bank Name *</Label>
                      <Input placeholder="E.g., Chase" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Number *</Label>
                      <Input placeholder="E.g., ****5678" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                    </div>
                    <div>
                      <Label>Initial Balance ($) *</Label>
                      <Input type="number" step="0.01" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit">Create Account</Button>
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accounts.map((acc) => (
              <Card key={acc.id} className="p-6 relative overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {acc.accountType}
                    </Badge>
                    <h3 className="font-bold text-lg text-foreground">{acc.accountName}</h3>
                    <p className="text-xs text-muted-foreground">{acc.bankName} • {acc.accountNumber}</p>
                  </div>
                  <Landmark className="h-8 w-8 text-primary/20 shrink-0" />
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                  <span className="text-xs text-muted-foreground">Book Balance</span>
                  <span className={`text-xl font-bold ${acc.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* BANK FEEDS TAB */}
      {activeTab === "feeds" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Imported Bank Feeds</h2>
            <Button variant="outline" size="sm" onClick={() => toast.success("Refreshed bank feeds. No new transactions found.")}>
              <Rss className="h-4 w-4 mr-2" />
              Sync Feeds (API)
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <ScrollArea className="h-[450px]">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border font-medium text-muted-foreground">
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {t.description}
                      </td>
                      <td className={`p-3 text-right font-bold ${t.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "deposit" ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={
                          t.status === "matched" ? "bg-green-100 text-green-800" :
                          t.status === "categorized" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* MATCH & CATEGORIZE TAB */}
      {activeTab === "categorize" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Select Transaction to Match</h2>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-4">
                {transactions.filter(t => t.status === "uncategorized").map((t) => (
                  <Card
                    key={t.id}
                    onClick={() => setSelectedTxn(t)}
                    className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                      selectedTxn?.id === t.id ? "border-2 border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-bold ${t.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "deposit" ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Matching & Categorization Panel</h2>
            {selectedTxn ? (
              <Card className="p-6 space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Selected Feed Item</p>
                  <p className="font-bold text-lg mt-1">{selectedTxn.description}</p>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span>Date: {new Date(selectedTxn.date).toLocaleDateString()}</span>
                    <span className={`font-bold ${selectedTxn.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                      ${Math.abs(selectedTxn.amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Match Mode */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm border-b pb-1">Option A: Match Against Ledger Documents</h3>
                  
                  {selectedTxn.type === "deposit" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Unpaid Customer Invoices (Expected match amounts):</p>
                      {invoices.filter(i => i.status !== "paid").length === 0 ? (
                        <p className="text-xs italic text-muted-foreground">No unpaid customer invoices available</p>
                      ) : (
                        invoices.filter(i => i.status !== "paid").map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 text-sm">
                            <div>
                              <p className="font-semibold">{inv.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">{inv.customerName}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold">${inv.total.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMatchTransaction(selectedTxn, inv.id, "Invoice")}
                                className="text-xs"
                              >
                                Match
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Unpaid Vendor Bills:</p>
                      {bills.filter(b => b.status !== "paid").length === 0 ? (
                        <p className="text-xs italic text-muted-foreground">No unpaid vendor bills available</p>
                      ) : (
                        bills.filter(b => b.status !== "paid").map((b) => (
                          <div key={b.id} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 text-sm">
                            <div>
                              <p className="font-semibold">{b.billNumber}</p>
                              <p className="text-xs text-muted-foreground">{b.vendorName}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold">${b.total.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMatchTransaction(selectedTxn, b.id, "Bill")}
                                className="text-xs"
                              >
                                Match
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Categorization */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-1">Option B: Categorize Directly</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickCategorize(selectedTxn, "SaaS & Subscriptions")}>
                      SaaS Expense
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickCategorize(selectedTxn, "Office Supplies")}>
                      Office Supplies
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickCategorize(selectedTxn, "Rent Expense")}>
                      Rent Expense
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickCategorize(selectedTxn, "Sales Income")}>
                      Sales Income
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/30" />
                Select a bank transaction from the left panel to begin match analysis.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* RECONCILIATION TAB */}
      {activeTab === "reconciliation" && (
        <Card className="p-6 max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Reconcile Accounts</h2>
              <p className="text-xs text-muted-foreground">Mark a period as fully audited and matching book records.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Reconcilation Period</Label>
              <Select value={selectedReconciledMonth} onValueChange={setSelectedReconciledMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="June 2026">June 2026</SelectItem>
                  <SelectItem value="May 2026">May 2026</SelectItem>
                  <SelectItem value="April 2026">April 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 p-4 rounded border text-sm space-y-2">
              <div className="flex justify-between">
                <span>Total Matches This Period:</span>
                <span className="font-semibold text-emerald-600">
                  {transactions.filter(t => t.status === "matched" || t.status === "categorized").length} transactions
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unresolved Items:</span>
                <span className="font-semibold text-amber-600">
                  {transactions.filter(t => t.status === "uncategorized").length} transactions
                </span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Period Audit Status:</span>
                <span>
                  {reconciledMonths.includes(selectedReconciledMonth) ? (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      Reconciled ✓
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      Pending Reconciliation
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleReconcile}
              disabled={reconciledMonths.includes(selectedReconciledMonth)}
            >
              Reconcile for {selectedReconciledMonth}
            </Button>

            {reconciledMonths.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Audit History Logs</p>
                <div className="space-y-1">
                  {reconciledMonths.map(m => (
                    <div key={m} className="flex justify-between text-xs text-green-700 font-medium bg-green-50/50 p-2 rounded">
                      <span>✓ Period Reconciled: {m}</span>
                      <span>By Admin</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
