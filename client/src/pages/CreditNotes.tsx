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
import {
  Plus, Edit2, Trash2, CheckCircle, RotateCcw, Ban, AlertCircle, Link,
} from "lucide-react";
import { CreditNote, LineItem, Invoice } from "@/types";
import {
  creditNoteStorage,
  customerStorage,
  invoiceStorage,
  applyCreditToInvoice,
  refundCreditNote,
  voidCreditNote,
  getEffectiveStatus,
} from "@/lib/storage";
import LineItemsTable from "@/components/LineItemsTable";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_STYLE: Record<string, string> = {
  open:   "bg-success/12 text-success",
  closed: "bg-muted text-muted-foreground",
  void:   "bg-destructive/10 text-destructive",
};

// ─── component ────────────────────────────────────────────────────────────────

export default function CreditNotes() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sourceInvoiceId, setSourceInvoiceId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);

  // apply dialog
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyCn, setApplyCn] = useState<CreditNote | null>(null);
  const [applyInvoiceId, setApplyInvoiceId] = useState("");
  const [applyAmount, setApplyAmount] = useState("");

  // refund dialog
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundCn, setRefundCn] = useState<CreditNote | null>(null);
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    load();
    setCustomers(customerStorage.getAll().filter(c => c.isActive !== false));
    setAllInvoices(invoiceStorage.getAll());
  }, []);

  const load = () => setCreditNotes(creditNoteStorage.getAll());

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const taxAmount = lineItems.reduce((s, i) => s + (i.amount * i.taxRate) / 100, 0);
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setCustomerId(""); setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setSourceInvoiceId(""); setReason(""); setNotes("");
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setEditingId(null);
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setCustomerName(customers.find(c => c.id === id)?.name ?? "");
    setSourceInvoiceId("");
  };

  const customerInvoices = allInvoices.filter(i => i.customerId === customerId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (lineItems.every(li => !li.itemName)) { toast.error("Add at least one line item"); return; }

    const current = editingId ? creditNotes.find(n => n.id === editingId) : null;
    const payload = {
      creditNoteNumber: current?.creditNoteNumber ?? creditNoteStorage.getNextNumber(),
      customerId,
      customerName,
      date: new Date(date).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      sourceInvoiceId: sourceInvoiceId || undefined,
      reason: reason || undefined,
      notes: notes || undefined,
      status: "open" as const,
      applications: current?.applications ?? [],
      refundedAmount: current?.refundedAmount ?? 0,
      creditRemaining: current?.creditRemaining ?? total,
    };

    if (editingId) {
      creditNoteStorage.update(editingId, payload);
      toast.success("Credit note updated");
    } else {
      creditNoteStorage.add(payload);
      toast.success("Credit note created");
    }
    load(); resetForm(); setIsFormOpen(false);
  };

  const handleEdit = (cn: CreditNote) => {
    setEditingId(cn.id);
    setCustomerId(cn.customerId);
    setCustomerName(cn.customerName);
    setDate(new Date(cn.date).toISOString().split("T")[0]);
    setSourceInvoiceId(cn.sourceInvoiceId ?? "");
    setReason(cn.reason ?? "");
    setNotes(cn.notes ?? "");
    setLineItems(cn.lineItems);
    setIsFormOpen(true);
  };

  const handleDelete = (cn: CreditNote) => {
    if (!confirm(`Delete ${cn.creditNoteNumber}? This cannot be undone.`)) return;
    creditNoteStorage.delete(cn.id);
    toast.success("Credit note deleted");
    load();
  };

  // ── Apply to Invoice ────────────────────────────────────────────────────────
  const openApply = (cn: CreditNote) => {
    setApplyCn(cn);
    setApplyInvoiceId("");
    setApplyAmount(String((cn.creditRemaining ?? cn.total).toFixed(2)));
    setIsApplyOpen(true);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCn || !applyInvoiceId) { toast.error("Select an invoice"); return; }
    const amount = parseFloat(applyAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }

    const { creditNote } = applyCreditToInvoice(applyCn.id, applyInvoiceId, amount);
    if (creditNote) {
      toast.success(`Applied $${fmt(amount)} to invoice`);
      setAllInvoices(invoiceStorage.getAll());
    }
    load();
    setIsApplyOpen(false);
    setApplyCn(null);
  };

  /** Open invoices for the selected credit note's customer */
  const applyableInvoices = allInvoices.filter(inv => {
    if (inv.customerId !== applyCn?.customerId) return false;
    const eff = getEffectiveStatus(inv);
    return !["paid", "void"].includes(eff);
  });

  // ── Refund ──────────────────────────────────────────────────────────────────
  const openRefund = (cn: CreditNote) => {
    setRefundCn(cn);
    setRefundAmount(String((cn.creditRemaining ?? cn.total).toFixed(2)));
    setIsRefundOpen(true);
  };

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundCn) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid refund amount"); return; }
    refundCreditNote(refundCn.id, amount);
    toast.success(`Refunded $${fmt(amount)}`);
    load();
    setIsRefundOpen(false);
    setRefundCn(null);
  };

  // ── Void ────────────────────────────────────────────────────────────────────
  const handleVoid = (cn: CreditNote) => {
    if (!confirm(`Void ${cn.creditNoteNumber}? This cannot be undone.`)) return;
    voidCreditNote(cn.id);
    toast.success("Credit note voided");
    load();
  };

  // ── filter ──────────────────────────────────────────────────────────────────
  const filtered = creditNotes
    .filter(cn => filterStatus === "all" || cn.status === filterStatus)
    .filter(cn =>
      cn.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cn.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
    { key: "void", label: "Void" },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Credit Notes</h1>
          <p className="text-muted-foreground mt-1">Issue credits for returns, overcharges, and adjustments</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={o => { setIsFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Credit Note
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Credit Note" : "Create Credit Note"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-muted/30 dark:bg-muted/10">
              <div className="max-w-5xl mx-auto bg-card p-8 rounded-2xl shadow-sm">
                <form id="cn-form" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer *</Label>
                      <Select value={customerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Credit Note Date</Label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    {customerId && (
                      <div>
                        <Label>Link to Invoice (optional)</Label>
                        <Select value={sourceInvoiceId} onValueChange={setSourceInvoiceId}>
                          <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {customerInvoices.map(inv => (
                              <SelectItem key={inv.id} value={inv.id}>
                                {inv.invoiceNumber} — ${fmt(inv.total)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Reason</Label>
                      <Input value={reason} onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Returned goods, overcharge…" />
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
                        <span>Credit Total</span>
                        <span>${fmt(total)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Internal notes…" rows={2} />
                  </div>
                </form>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="cn-form">
                {editingId ? "Update" : "Create Credit Note"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter chips + search */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search credit notes…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
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
            <p className="text-muted-foreground">No credit notes found</p>
          </Card>
        ) : (
          filtered.map(cn => {
            const remaining = cn.creditRemaining ?? cn.total;
            return (
              <Card key={cn.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-foreground">{cn.creditNoteNumber}</span>
                      <Badge className={STATUS_STYLE[cn.status] ?? STATUS_STYLE.open}>
                        {cn.status.charAt(0).toUpperCase() + cn.status.slice(1)}
                      </Badge>
                      {cn.sourceInvoiceId && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          {invoiceStorage.getAll().find(i => i.id === cn.sourceInvoiceId)?.invoiceNumber ?? "Invoice"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cn.customerName} · {new Date(cn.date).toLocaleDateString()}
                      {cn.reason && ` · ${cn.reason}`}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-bold text-foreground">${fmt(cn.total)}</span>
                      {remaining < cn.total && (
                        <span className="text-xs text-muted-foreground">
                          ${fmt(remaining)} remaining
                        </span>
                      )}
                    </div>

                    {/* Application history */}
                    {(cn.applications?.length ?? 0) > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {cn.applications!.map((app, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            Applied <span className="font-medium">${fmt(app.amountApplied)}</span> to {app.invoiceNumber}
                            {" "}· {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    {cn.status === "open" && remaining > 0 && (
                      <>
                        <Button size="sm" variant="outline"
                          className="text-xs text-success border-success/30 hover:bg-success/10"
                          onClick={() => openApply(cn)}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Apply
                        </Button>
                        <Button size="sm" variant="outline"
                          className="text-xs"
                          onClick={() => openRefund(cn)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Refund
                        </Button>
                      </>
                    )}
                    {cn.status !== "void" && (
                      <Button size="sm" variant="ghost" onClick={() => handleVoid(cn)}
                        className="text-destructive hover:bg-destructive/10" title="Void">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(cn)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(cn)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Apply to Invoice dialog ───────────────────────────────────────────── */}
      <Dialog open={isApplyOpen} onOpenChange={o => { setIsApplyOpen(o); if (!o) setApplyCn(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Credit — {applyCn?.creditNoteNumber}</DialogTitle>
          </DialogHeader>
          {applyCn && (
            <form onSubmit={handleApply} className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Credit remaining: <strong>${fmt(applyCn.creditRemaining ?? applyCn.total)}</strong>
              </p>
              <div>
                <Label>Apply to Invoice *</Label>
                <Select value={applyInvoiceId} onValueChange={setApplyInvoiceId}>
                  <SelectTrigger><SelectValue placeholder="Select open invoice" /></SelectTrigger>
                  <SelectContent>
                    {applyableInvoices.length === 0
                      ? <SelectItem value="" disabled>No open invoices for this customer</SelectItem>
                      : applyableInvoices.map(inv => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} — ${fmt(inv.balance_due ?? inv.total)} due
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount to Apply ($) *</Label>
                <Input type="number" step="0.01" min="0.01"
                  max={applyCn.creditRemaining ?? applyCn.total}
                  value={applyAmount}
                  onChange={e => setApplyAmount(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
                <Button type="submit">Apply Credit</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Refund dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={isRefundOpen} onOpenChange={o => { setIsRefundOpen(o); if (!o) setRefundCn(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Credit — {refundCn?.creditNoteNumber}</DialogTitle>
          </DialogHeader>
          {refundCn && (
            <form onSubmit={handleRefund} className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-xl border border-warning/20">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm">
                  Refunding pays the credit back as cash rather than applying it to an invoice.
                  Credit remaining: <strong>${fmt(refundCn.creditRemaining ?? refundCn.total)}</strong>
                </p>
              </div>
              <div>
                <Label>Refund Amount ($) *</Label>
                <Input type="number" step="0.01" min="0.01"
                  max={refundCn.creditRemaining ?? refundCn.total}
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsRefundOpen(false)}>Cancel</Button>
                <Button type="submit" variant="destructive">Issue Refund</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
