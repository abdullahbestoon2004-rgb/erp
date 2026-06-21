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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, DollarSign, CreditCard, Info } from "lucide-react";
import { PaymentReceived, Invoice } from "@/types";
import {
  paymentReceivedStorage,
  customerStorage,
  invoiceStorage,
  applyPaymentToInvoices,
  getEffectiveStatus,
} from "@/lib/storage";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── component ────────────────────────────────────────────────────────────────

export default function PaymentsReceived() {
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // form state
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentReceived["paymentMode"]>("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  /** Map of invoiceId → allocation string */
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
    setCustomers(customerStorage.getAll().filter(c => c.isActive !== false));
    setAllInvoices(invoiceStorage.getAll());
  }, []);

  const load = () => setPayments(paymentReceivedStorage.getAll());

  const resetForm = () => {
    setCustomerId(""); setCustomerName(""); setTotalAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Bank Transfer"); setReferenceNumber(""); setNotes("");
    setAllocations({});
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setCustomerName(customers.find(c => c.id === id)?.name ?? "");
    setAllocations({});
  };

  /** Open invoices for the selected customer */
  const openInvoices = allInvoices.filter(inv => {
    if (inv.customerId !== customerId) return false;
    const eff = getEffectiveStatus(inv);
    return !["paid", "void"].includes(eff);
  });

  const allocatedTotal = Object.values(allocations).reduce(
    (s, v) => s + (parseFloat(v) || 0), 0
  );
  const total = parseFloat(totalAmount) || 0;
  const unusedAmount = Math.max(0, total - allocatedTotal);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (total <= 0) { toast.error("Enter a payment amount"); return; }
    if (allocatedTotal > total) {
      toast.error(`Allocated ($${fmt(allocatedTotal)}) exceeds payment ($${fmt(total)})`);
      return;
    }

    const apps = Object.entries(allocations)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([invoiceId, v]) => ({ invoiceId, amountApplied: parseFloat(v) }));

    applyPaymentToInvoices({
      customerId,
      customerName,
      totalAmount: total,
      paymentDate: new Date(paymentDate).getTime(),
      paymentMode,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
      applications: apps,
    });

    // refresh invoice list
    setAllInvoices(invoiceStorage.getAll());
    toast.success("Payment recorded successfully");
    load();
    resetForm();
    setIsFormOpen(false);
  };

  const handleDelete = (p: PaymentReceived) => {
    if (!confirm("Delete this payment? Invoice balances will NOT be automatically restored.")) return;
    paymentReceivedStorage.delete(p.id);
    toast.success("Payment deleted");
    load();
  };

  const filtered = payments.filter(p =>
    p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalUnused = payments.reduce((s, p) => s + (p.unusedAmount ?? 0), 0);

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Payments Received</h1>
          <p className="text-muted-foreground mt-1">Record and allocate customer payments</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={o => { setIsFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">Record Payment Received</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-muted/30 dark:bg-muted/10">
              <div className="max-w-3xl mx-auto bg-card p-8 rounded-2xl shadow-sm">
                <form id="payment-form" onSubmit={handleSave} className="space-y-5">

                  {/* Customer */}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount Received ($) *</Label>
                      <Input type="number" step="0.01" min="0.01"
                        value={totalAmount}
                        onChange={e => setTotalAmount(e.target.value)}
                        placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Payment Date</Label>
                      <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
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
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Reference / Check #</Label>
                      <Input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                        placeholder="TXN / Check number…" />
                    </div>
                  </div>

                  {/* Open invoice allocation */}
                  {customerId && openInvoices.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Apply to Invoices</Label>
                      <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice</th>
                              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance Due</th>
                              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">Apply</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {openInvoices.map(inv => {
                              const bal = inv.balance_due ?? inv.total;
                              return (
                                <tr key={inv.id} className="hover:bg-muted/20">
                                  <td className="px-4 py-2.5">
                                    <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      Due {new Date(inv.dueDate).toLocaleDateString()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-medium">${fmt(bal)}</td>
                                  <td className="px-4 py-2.5">
                                    <Input
                                      type="number" step="0.01" min="0"
                                      max={bal}
                                      value={allocations[inv.id] ?? ""}
                                      onChange={e => setAllocations(prev => ({ ...prev, [inv.id]: e.target.value }))}
                                      placeholder="0.00"
                                      className="text-right h-8 text-sm"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary */}
                      <div className="mt-3 flex justify-end">
                        <div className="w-64 space-y-1.5 text-sm bg-muted/40 rounded-xl p-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment amount</span>
                            <span>${fmt(total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Applied to invoices</span>
                            <span className={allocatedTotal > total ? "text-destructive font-semibold" : ""}>${fmt(allocatedTotal)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                            <span>Unused / credit</span>
                            <span className={unusedAmount > 0 ? "text-amber-600 dark:text-amber-400" : ""}>${fmt(unusedAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {customerId && openInvoices.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl text-sm text-muted-foreground">
                      <Info className="h-4 w-4 shrink-0" />
                      No open invoices for this customer. Payment will be saved as unused credit.
                    </div>
                  )}

                  <div>
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Internal notes…" rows={2} />
                  </div>
                </form>
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" form="payment-form">Record Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Total Received</p>
            <p className="text-2xl font-bold text-foreground">${fmt(totalReceived)}</p>
          </div>
        </Card>
        {totalUnused > 0 && (
          <Card className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Unused Credit</p>
              <p className="text-2xl font-bold text-foreground">${fmt(totalUnused)}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by payment number or customer…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No payments recorded yet</p>
          </Card>
        ) : (
          filtered.map(p => (
            <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-foreground">{p.paymentNumber}</span>
                    <Badge variant="outline" className="text-xs">{p.paymentMode}</Badge>
                    {(p.unusedAmount ?? 0) > 0 && (
                      <Badge className="bg-warning/15 text-warning text-xs">
                        ${fmt(p.unusedAmount!)} unused
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.customerName} · {new Date(p.date).toLocaleDateString()}
                  </p>
                  {p.referenceNumber && (
                    <p className="text-xs text-muted-foreground mt-0.5">Ref: {p.referenceNumber}</p>
                  )}

                  {/* Applications */}
                  {(p.applications?.length ?? 0) > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {p.applications!.map((app, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          Applied <span className="font-medium text-foreground">${fmt(app.amountApplied)}</span> to {app.invoiceNumber}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Legacy single-invoice backwards compat */}
                  {!p.applications?.length && p.invoiceNumber && (
                    <p className="text-xs text-primary/80 mt-1">Applied to {p.invoiceNumber}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-lg text-foreground">${fmt(p.amount)}</span>
                  <Button size="sm" variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(p)}>
                    <Trash2 className="h-4 w-4" />
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
