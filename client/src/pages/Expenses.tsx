import { useState, useEffect } from "react";
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
import { Plus, Edit2, Trash2, Paperclip, FileText, CheckCircle2 } from "lucide-react";
import { Expense } from "@/types";
import { expenseStorage, bankAccountStorage } from "@/lib/storage";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Rent Expense",
  "SaaS & Subscriptions",
  "Office Supplies",
  "Travel Expense",
  "Meals & Entertainment",
  "Advertising & Marketing",
  "Utilities",
  "Salaries & Wages",
  "Other Expenses"
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAccount, setPaymentAccount] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(false);
  const [status, setStatus] = useState<"unbilled" | "invoiced" | "reimbursed">("unbilled");
  const [mockAttachment, setMockAttachment] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
    setAccounts(bankAccountStorage.getAll());
  }, []);

  const loadExpenses = () => {
    setExpenses(expenseStorage.getAll());
  };

  const resetForm = () => {
    setCategory("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentAccount("");
    setVendorName("");
    setDescription("");
    setBillable(false);
    setStatus("unbilled");
    setMockAttachment(null);
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !paymentAccount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const currentExp = editingId ? expenses.find((x) => x.id === editingId) : null;
    const expenseData = {
      expenseNumber: currentExp?.expenseNumber || expenseStorage.getNextNumber(),
      category,
      amount: parseFloat(amount) || 0,
      date: new Date(date).getTime(),
      paymentAccount,
      vendorName: vendorName || undefined,
      description: description || undefined,
      billable,
      status,
    };

    if (editingId) {
      expenseStorage.update(editingId, expenseData);
      toast.success("Expense updated successfully");
    } else {
      expenseStorage.add(expenseData);
      toast.success("Expense created successfully");
    }

    loadExpenses();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setCategory(exp.category);
    setAmount(exp.amount.toString());
    setDate(new Date(exp.date).toISOString().split("T")[0]);
    setPaymentAccount(exp.paymentAccount);
    setVendorName(exp.vendorName || "");
    setDescription(exp.description || "");
    setBillable(exp.billable);
    setStatus(exp.status);
    setMockAttachment("receipt_mock.png");
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      expenseStorage.delete(id);
      toast.success("Expense deleted successfully");
      loadExpenses();
    }
  };

  const triggerUploadMock = () => {
    setMockAttachment("uploaded_receipt.jpg");
    toast.success("Receipt image attached successfully");
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.vendorName && exp.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case "reimbursed":
        return "bg-green-100 text-green-800";
      case "invoiced":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track business expenditure and billable expenses</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Expense Details" : "Record New Expense"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Paid Through *</Label>
                <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account / card" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.accountName}>
                        {acc.accountName} ({acc.accountType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor (Optional)</Label>
                  <Input
                    placeholder="Vendor Name"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unbilled">Unbilled</SelectItem>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Notes about the purchase"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="billable"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="billable" className="cursor-pointer select-none">
                  Billable to Customer
                </Label>
              </div>

              <div className="border border-dashed border-border rounded-lg p-3 flex flex-col items-center justify-center bg-muted/30">
                {mockAttachment ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                    <Paperclip className="h-4 w-4" />
                    <span>{mockAttachment}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMockAttachment(null)}
                      className="h-5 w-5 p-0 text-red-500 font-bold ml-2"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={triggerUploadMock} className="text-xs">
                    <Paperclip className="h-3.5 w-3.5 mr-1" />
                    Attach Receipt Image (Mock)
                  </Button>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update Expense" : "Record Expense"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by category, vendor or expense number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredExpenses.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No expenses recorded</p>
            </Card>
          ) : (
            filteredExpenses.map((exp) => (
              <Card key={exp.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-semibold text-foreground">
                        {exp.category}
                      </h3>
                      <Badge className={getStatusColor(exp.status)}>
                        {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                      </Badge>
                      {exp.billable && (
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                          Billable
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>{exp.expenseNumber}</span>
                      <span>•</span>
                      <span>Paid via {exp.paymentAccount}</span>
                      {exp.vendorName && (
                        <>
                          <span>•</span>
                          <span>Vendor: {exp.vendorName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </p>
                    {exp.description && (
                      <p className="text-xs text-muted-foreground italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-foreground">
                      ${exp.amount.toFixed(2)}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(exp)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(exp.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
