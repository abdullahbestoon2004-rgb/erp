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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, List, BarChart2, Box, Lock, Plus, Trash2, ShieldCheck } from "lucide-react";
import { JournalEntry, JournalLine, COAAccount, Budget, FixedAsset } from "@/types";
import { journalEntryStorage, coaStorage, budgetStorage, fixedAssetStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Accountant() {
  const [location, navigate] = useLocation();

  // Loaded states
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [coa, setCoa] = useState<COAAccount[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [lockDate, setLockDate] = useState<string>("2026-01-01");

  // Manual Journal Form States
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split("T")[0]);
  const [journalReference, setJournalReference] = useState("");
  const [journalNotes, setJournalNotes] = useState("");
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    { id: "1", accountId: "", accountName: "", debit: 0, credit: 0 },
    { id: "2", accountId: "", accountName: "", debit: 0, credit: 0 },
  ]);

  // COA Form States
  const [isCoaOpen, setIsCoaOpen] = useState(false);
  const [coaName, setCoaName] = useState("");
  const [coaCode, setCoaCode] = useState("");
  const [coaType, setCoaType] = useState<"Asset" | "Liability" | "Equity" | "Revenue" | "Expense">("Asset");
  const [coaDesc, setCoaDesc] = useState("");

  // Budget Form States
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [budgetYear, setBudgetYear] = useState("2026");
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, number>>({});

  // Fixed Asset Form States
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assetPurchaseDate, setAssetPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [assetValue, setAssetValue] = useState("");
  const [deprRate, setDeprRate] = useState("10");

  useEffect(() => {
    loadData();
    const locked = localStorage.getItem("zoho_lock_date");
    if (locked) setLockDate(locked);
  }, []);

  const loadData = () => {
    setJournals(journalEntryStorage.getAll());
    setCoa(coaStorage.getAll());
    setBudgets(budgetStorage.getAll());
    setAssets(fixedAssetStorage.getAll());
  };

  // 1. Journal Save Handler
  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = journalLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = journalLines.reduce((sum, l) => sum + l.credit, 0);

    if (totalDebit <= 0 || totalCredit <= 0) {
      toast.error("Debits and credits must be greater than zero.");
      return;
    }

    if (totalDebit !== totalCredit) {
      toast.error(`Out of balance: Debit total is $${totalDebit.toFixed(2)}, Credit total is $${totalCredit.toFixed(2)}. They must match!`);
      return;
    }

    // Check if any line has unselected account
    if (journalLines.some(l => !l.accountId)) {
      toast.error("Please select a valid account for all journal lines.");
      return;
    }

    const nextJournalNumber = journalEntryStorage.getNextNumber();
    journalEntryStorage.add({
      journalNumber: nextJournalNumber,
      date: new Date(journalDate).getTime(),
      reference: journalReference || undefined,
      notes: journalNotes,
      lines: journalLines,
      totalDebit,
      totalCredit
    });

    toast.success(`Journal Entry ${nextJournalNumber} recorded!`);
    loadData();
    setIsJournalOpen(false);
    // reset form
    setJournalDate(new Date().toISOString().split("T")[0]);
    setJournalReference("");
    setJournalNotes("");
    setJournalLines([
      { id: "1", accountId: "", accountName: "", debit: 0, credit: 0 },
      { id: "2", accountId: "", accountName: "", debit: 0, credit: 0 },
    ]);
  };

  const handleLineChange = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...journalLines];
    if (field === "debit" || field === "credit") {
      newLines[index][field] = parseFloat(value) || 0;
    } else if (field === "accountId") {
      newLines[index].accountId = value;
      const act = coa.find(c => c.id === value);
      if (act) {
        newLines[index].accountName = act.accountName;
      }
    } else {
      (newLines[index] as any)[field] = value;
    }
    setJournalLines(newLines);
  };

  const addJournalLine = () => {
    setJournalLines([...journalLines, { id: Date.now().toString(), accountId: "", accountName: "", debit: 0, credit: 0 }]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length <= 2) {
      toast.error("A journal entry requires at least two lines.");
      return;
    }
    setJournalLines(journalLines.filter((_, i) => i !== index));
  };

  // 2. Chart of Accounts Save
  const handleSaveCoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coaName || !coaCode) {
      toast.error("Code and Name are required");
      return;
    }

    coaStorage.add({
      id: `coa-${Date.now()}`,
      accountName: coaName,
      accountType: coaType,
      code: coaCode,
      description: coaDesc || undefined
    });

    toast.success("Account created successfully!");
    loadData();
    setIsCoaOpen(false);
    setCoaName("");
    setCoaCode("");
    setCoaDesc("");
  };

  // 3. Budgets Save
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetName) {
      toast.error("Budget name is required");
      return;
    }

    const entries = coa.map(c => ({
      accountId: c.id,
      accountName: c.accountName,
      budgetedAmount: budgetAmounts[c.id] || 0
    }));

    budgetStorage.add({
      year: parseInt(budgetYear) || 2026,
      budgetName,
      entries
    });

    toast.success(`Budget "${budgetName}" set successfully!`);
    loadData();
    setIsBudgetOpen(false);
    setBudgetName("");
    setBudgetAmounts({});
  };

  // 4. Fixed Asset Save
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetCode || !assetValue) {
      toast.error("Required fields must be populated");
      return;
    }

    fixedAssetStorage.add({
      assetName,
      assetCode,
      purchaseDate: new Date(assetPurchaseDate).getTime(),
      purchaseValue: parseFloat(assetValue) || 0,
      depreciationMethod: "Straight Line",
      rate: parseFloat(deprRate) || 10,
      bookValue: parseFloat(assetValue) || 0
    });

    toast.success(`Asset ${assetName} registered!`);
    loadData();
    setIsAssetOpen(false);
    setAssetName("");
    setAssetCode("");
    setAssetValue("");
  };

  // Straight line depreciation run (1 year simulation)
  const runAssetDepreciation = (asset: FixedAsset) => {
    const depreciationExpense = (asset.purchaseValue * asset.rate) / 100;
    const newBookValue = Math.max(0, asset.bookValue - depreciationExpense);
    
    // update asset book value in storage
    fixedAssetStorage.delete(asset.id);
    fixedAssetStorage.add({
      ...asset,
      bookValue: newBookValue
    });
    toast.success(`Straight line depreciation of $${depreciationExpense.toFixed(2)} applied to ${asset.assetName}`);
    loadData();
  };

  // 5. Save Transaction Lock
  const handleSaveLock = () => {
    localStorage.setItem("zoho_lock_date", lockDate);
    toast.success(`All transactions prior to ${new Date(lockDate).toLocaleDateString()} are now LOCKED from edits.`);
  };

  // Tabs mapping
  const getActiveTab = () => {
    if (location === "/accountant/coa") return "coa";
    if (location === "/accountant/budgets") return "budgets";
    if (location === "/accountant/fixed-assets") return "fixed-assets";
    if (location === "/accountant/lock") return "lock";
    return "journals";
  };

  const activeTab = getActiveTab();

  const renderTabs = () => {
    const tabs = [
      { id: "journals", label: "Manual Journals", path: "/accountant/journals", icon: BookOpen },
      { id: "coa", label: "Chart of Accounts", path: "/accountant/coa", icon: List },
      { id: "budgets", label: "Budgets", path: "/accountant/budgets", icon: BarChart2 },
      { id: "fixed-assets", label: "Fixed Assets", path: "/accountant/fixed-assets", icon: Box },
      { id: "lock", label: "Transaction Locking", path: "/accountant/lock", icon: Lock },
    ];

    return (
      <div className="flex border-b border-border mb-6 overflow-x-auto whitespace-nowrap">
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
        <h1 className="font-display font-bold text-3xl text-foreground">Accountant Tools</h1>
        <p className="text-muted-foreground mt-1">Manual journals, fixed assets calculation, budgets, & charts of accounts</p>
      </div>

      {renderTabs()}

      {/* MANUAL JOURNALS */}
      {activeTab === "journals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Double-Entry Journals</h2>
            <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Journal Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Manual Journal Entry</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveJournal} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Journal Date</Label>
                      <Input type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Reference Number (Optional)</Label>
                      <Input placeholder="E.g., REF-99" value={journalReference} onChange={(e) => setJournalReference(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Journal Lines *</Label>
                    <div className="space-y-2">
                      {journalLines.map((line, index) => (
                        <div key={line.id} className="grid grid-cols-12 gap-2">
                          <Select value={line.accountId} onValueChange={(v) => handleLineChange(index, "accountId", v)}>
                            <SelectTrigger className="col-span-5 text-xs">
                              <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                              {coa.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  [{c.code}] {c.accountName} ({c.accountType})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Description"
                            value={line.description || ""}
                            onChange={(e) => handleLineChange(index, "description", e.target.value)}
                            className="col-span-3 text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Debit"
                            value={line.debit || ""}
                            onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                            className="col-span-2 text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Credit"
                            value={line.credit || ""}
                            onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                            className="col-span-1.5 text-xs"
                          />
                          <div className="col-span-0.5 flex items-center justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeJournalLine(index)}
                              className="h-6 w-6 p-0 text-red-500 font-bold"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" onClick={addJournalLine} className="mt-2 w-full text-xs">
                      + Add Row
                    </Button>
                  </div>

                  <Card className="p-3 bg-muted/50">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total Debit: ${journalLines.reduce((sum, l) => sum + l.debit, 0).toFixed(2)}</span>
                      <span>Total Credit: ${journalLines.reduce((sum, l) => sum + l.credit, 0).toFixed(2)}</span>
                    </div>
                  </Card>

                  <div>
                    <Label>Journal Notes *</Label>
                    <textarea
                      required
                      value={journalNotes}
                      onChange={(e) => setJournalNotes(e.target.value)}
                      placeholder="Notes explaining this entry..."
                      className="w-full p-2 border border-border rounded-md text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsJournalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Post Journal Entry</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[450px]">
            <div className="space-y-3">
              {journals.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex justify-between items-start border-b pb-2 mb-2">
                    <div>
                      <h3 className="font-bold text-foreground">{entry.journalNumber}</h3>
                      <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()} • Ref: {entry.reference || "None"}</p>
                    </div>
                    <Badge variant="outline" className="text-primary font-bold">
                      Balance: ${entry.totalDebit.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded border">
                    {entry.lines.map((l, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="font-medium text-slate-800">{l.accountName}</span>
                        <div className="space-x-4">
                          {l.debit > 0 && <span className="text-green-700 font-semibold">Dr: ${l.debit.toFixed(2)}</span>}
                          {l.credit > 0 && <span className="text-blue-700 font-semibold">Cr: ${l.credit.toFixed(2)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">Notes: {entry.notes}</p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* CHART OF ACCOUNTS */}
      {activeTab === "coa" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Standard Accounts Hierarchy</h2>
            <Dialog open={isCoaOpen} onOpenChange={setIsCoaOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Ledger Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveCoa} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Code *</Label>
                      <Input placeholder="E.g., 1025" value={coaCode} onChange={(e) => setCoaCode(e.target.value)} />
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Select value={coaType} onValueChange={(v: any) => setCoaType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asset">Asset</SelectItem>
                          <SelectItem value="Liability">Liability</SelectItem>
                          <SelectItem value="Equity">Equity</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                          <SelectItem value="Expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Account Name *</Label>
                    <Input placeholder="E.g., Stripe Clearing Cash" value={coaName} onChange={(e) => setCoaName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input placeholder="Detailed description of usage" value={coaDesc} onChange={(e) => setCoaDesc(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsCoaOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Account</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-border font-medium text-muted-foreground">
                  <th className="p-3">Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coa.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-600">{account.code}</td>
                    <td className="p-3 font-bold text-foreground">{account.accountName}</td>
                    <td className="p-3">
                      <Badge className={
                        account.accountType === "Asset" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                        account.accountType === "Liability" ? "bg-amber-50 text-amber-800 border-amber-200" :
                        account.accountType === "Revenue" ? "bg-blue-50 text-blue-800 border-blue-200" :
                        "bg-slate-50 text-slate-800 border-slate-200"
                      }>
                        {account.accountType}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* BUDGETS */}
      {activeTab === "budgets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Budget Targets</h2>
            <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Define Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Define Annual Budget</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveBudget} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Budget Name *</Label>
                      <Input placeholder="E.g., Conservative 2026 Plan" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Fiscal Year</Label>
                      <Input value={budgetYear} onChange={(e) => setBudgetYear(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase border-b pb-1">Targets per Account</p>
                    {coa.map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-slate-700 truncate w-1/2">{c.accountName}</span>
                        <Input
                          type="number"
                          placeholder="Budget amount ($)"
                          className="w-1/2 text-xs"
                          value={budgetAmounts[c.id] || ""}
                          onChange={(e) => setBudgetAmounts({ ...budgetAmounts, [c.id]: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsBudgetOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Establish Budget</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {budgets.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No active budgets established.
              </Card>
            ) : (
              budgets.map(b => (
                <Card key={b.id} className="p-4">
                  <h3 className="font-bold text-lg text-foreground">{b.budgetName} ({b.year})</h3>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                    {b.entries.slice(0, 4).map(e => (
                      <div key={e.accountId} className="text-xs">
                        <span className="text-muted-foreground block">{e.accountName}</span>
                        <span className="font-bold text-foreground text-sm">${e.budgetedAmount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* FIXED ASSETS */}
      {activeTab === "fixed-assets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Fixed Assets Depreciation (SLN)</h2>
            <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Acquire Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register Fixed Asset Acquisition</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveAsset} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Asset Code *</Label>
                      <Input placeholder="E.g., EQ-002" value={assetCode} onChange={(e) => setAssetCode(e.target.value)} />
                    </div>
                    <div>
                      <Label>Straight-line Rate (%)</Label>
                      <Input value={deprRate} onChange={(e) => setDeprRate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Asset Name *</Label>
                    <Input placeholder="E.g., MacBook Pro M3 Max" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Acquisition Date</Label>
                      <Input type="date" value={assetPurchaseDate} onChange={(e) => setAssetPurchaseDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Cost Value ($) *</Label>
                      <Input type="number" placeholder="0.00" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAssetOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Register Asset</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground col-span-2">
                No fixed assets registered.
              </Card>
            ) : (
              assets.map(asset => (
                <Card key={asset.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-foreground">{asset.assetName}</h3>
                      <p className="text-xs text-muted-foreground">Code: {asset.assetCode} • Method: {asset.depreciationMethod} ({asset.rate}%)</p>
                    </div>
                    <Badge variant="outline">Book Value: ${asset.bookValue.toFixed(2)}</Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">Original Cost: ${asset.purchaseValue.toFixed(2)}</div>
                    <Button size="sm" onClick={() => runAssetDepreciation(asset)} className="text-xs">
                      Depreciate 1 Year
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TRANSACTION LOCKING */}
      {activeTab === "lock" && (
        <Card className="p-6 max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Transaction Locking</h2>
              <p className="text-xs text-muted-foreground">Prevent any changes, additions or deletions to transactions prior to a set date.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Lock All Transactions Before</Label>
              <Input type="date" value={lockDate} onChange={(e) => setLockDate(e.target.value)} />
            </div>

            <Button className="w-full" onClick={handleSaveLock}>
              Save Locking Configuration
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
