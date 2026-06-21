import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit2, Trash2, Ban, RotateCcw, Receipt } from "lucide-react";
import { SalesReceipt, LineItem } from "@/types";
import { salesReceiptStorage, customerStorage } from "@/lib/storage";
import LineItemsTable from "@/components/LineItemsTable";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-success/12 text-success",
  draft:     "bg-muted text-muted-foreground",
  refunded:  "bg-warning/15 text-warning",
  void:      "bg-destructive/10 text-destructive",
};

// ─── component ────────────────────────────────────────────────────────────────

export default function SalesReceipts() {
  const [receipts, setReceipts] = useState<SalesReceipt[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<SalesReceipt["paymentMode"]>("Cash");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<SalesReceipt["status"]>("completed");

  useEffect(() => {
    load();
    setCustomers(customerStorage.getAll().filter(c => c.isActive !== false));
  }, []);

  const load = () => setReceipts(salesReceiptStorage.getAll());

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const taxAmount = lineItems.reduce((s, i) => s + (i.amount * i.taxRate) / 100, 0);
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setCustomerId(""); setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Cash");
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setNotes(""); setStatus("completed"); setEditingId(null);
  };

  const handleCustomerChange = (id: string) => {
    if (id === "__walkin__") {
      setCustomerId(""); setCustomerName("Walk-in");
    } else {
      setCustomerId(id);
      setCustomerName(customers.find(c => c.id === id)?.name ?? "");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.every(li => !li.itemName)) { toast.error("Add at least one line item"); return; }

    const current = editingId ? receipts.find(r => r.id === editingId) : null;
    const payload: Omit<SalesReceipt, "id" | "createdAt"> = {
      receiptNumber: current?.receiptNumber ?? salesReceiptStorage.getNextNumber(),
      customerId: customerId || undefined,
      customerName: customerName || "Walk-in",
      date: new Date(date).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      paymentMode,
      status,
      notes: notes || undefined,
    };

    if (editingId) {
      salesReceiptStorage.update(editingId, payload);
      toast.success("Sales receipt updated");
    } else {
      salesReceiptStorage.add(payload);
      toast.success("Sales receipt created");
    }
    load(); resetForm(); setIsFormOpen(false);
  };

  const handleEdit = (r: SalesReceipt) => {
    setEditingId(r.id);
    setCustomerId(r.customerId ?? "");
    setCustomerName(r.customerName ?? "Walk-in");
    setDate(new Date(r.date).toISOString().split("T")[0]);
    setPaymentMode(r.paymentMode);
    setLineItems(r.lineItems);
    setNotes(r.notes ?? "");
    setStatus(r.status);
    setIsFormOpen(true);
  };

  const handleDelete = (r: SalesReceipt) => {
    if (!confirm(`Delete ${r.receiptNumber}?`)) return;
    salesReceiptStorage.delete(r.id);
    toast.success("Sales receipt deleted");
    load();
  };

  const handleVoid = (r: SalesReceipt) => {
    if (!confirm(`Void ${r.receiptNumber}? This cannot be undone.`)) return;
    salesReceiptStorage.update(r.id, { status: "void" });
    toast.success("Sales receipt voided");
    load();
  };

  const handleRefund = (r: SalesReceipt) => {
    if (!confirm(`Mark ${r.receiptNumber} as refunded?`)) return;
    salesReceiptStorage.update(r.id, { status: "refunded" });
    toast.success("Sales receipt marked as refunded");
    load();
  };

  const filtered = receipts
    .filter(r => filterStatus === "all" || r.status === filterStatus)
    .filter(r =>
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customerName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const total_revenue = receipts
    .filter(r => r.status === "completed")
    .reduce((s, r) => s + r.total, 0);

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "draft", label: "Draft" },
    { key: "refunded", label: "Refunded" },
    { key: "void", label: "Void" },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Sales Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Instant-payment sales — no invoice, no receivable
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={o => { setIsFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Sales Receipt
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Sales Receipt" : "Create Sales Receipt"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-muted/30 dark:bg-muted/10">
              <div className="max-w-5xl mx-auto bg-card p-8 rounded-2xl shadow-sm">
                <form id="sr-form" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer (optional — leave blank for walk-in)</Label>
                      <Select
                        value={customerId || "__walkin__"}
                        onValueChange={handleCustomerChange}
                      >
                        <SelectTrigger><SelectValue placeholder="Walk-in / cash sale" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__walkin__">Walk-in / Cash Sale</SelectItem>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Receipt Date</Label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="void">Void</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Line Items *</Label>
                    <LineItemsTable value={lineItems} onChange={setLineItems} />
                  </div>

                  <div className="flex justify-end">
                    <div className="w-72 space-y-2 text-sm bg-muted/50 rounded-xl p-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>${fmt(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-border pt-2">
                        <span>Total</span>
                        <span>${fmt(total)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Notes for the customer…" rows={2} />
                  </div>
                </form>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="sr-form">
                {editingId ? "Update Receipt" : "Create Receipt"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue summary */}
      <Card className="p-4 flex items-center gap-4 w-fit">
        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">${fmt(total_revenue)}</p>
        </div>
      </Card>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by receipt number or customer…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1 flex-wrap">
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No sales receipts found</p>
          </Card>
        ) : (
          filtered.map(r => (
            <Card key={r.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-foreground">{r.receiptNumber}</span>
                    <Badge className={STATUS_STYLE[r.status] ?? STATUS_STYLE.completed}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Badge>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {r.paymentMode}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.customerName ?? "Walk-in"} · {new Date(r.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">${fmt(r.total)}</p>
                  {r.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.notes}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {r.status === "completed" && (
                    <Button size="sm" variant="ghost"
                      className="text-warning hover:bg-warning/10"
                      onClick={() => handleRefund(r)} title="Mark Refunded">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {r.status !== "void" && r.status !== "refunded" && (
                    <Button size="sm" variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleVoid(r)} title="Void">
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
