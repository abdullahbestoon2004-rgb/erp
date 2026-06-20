import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Plus, Edit2, Eye, Send, CheckCircle, DollarSign,
  Ban, Trash2, FileText, AlertCircle,
} from "lucide-react";
import { Invoice, InvoicePayment } from "@/types";
import {
  invoiceStorage,
  invoicePaymentStorage,
  sendInvoice,
  markInvoiceAsSent,
  recordInvoicePayment,
  voidInvoice,
  deleteDraftInvoice,
  getEffectiveStatus,
} from "@/lib/storage";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceDetail from "@/components/InvoiceDetail";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  draft:           "bg-slate-100 text-slate-600",
  sent:            "bg-blue-100 text-blue-700",
  partially_paid:  "bg-amber-100 text-amber-700",
  paid:            "bg-green-100 text-green-700",
  overdue:         "bg-red-100 text-red-700",
  void:            "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  draft:          "Draft",
  sent:           "Sent",
  partially_paid: "Partially Paid",
  paid:           "Paid",
  overdue:        "Overdue",
  void:           "Void",
};

// ─── component ────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // dialog open states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  // payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<InvoicePayment["method"]>("cash");
  const [payNote, setPayNote] = useState("");

  const load = () => setInvoices(invoiceStorage.getAll());

  useEffect(() => { load(); }, []);

  // ── Save draft ───────────────────────────────────────────────────────────────
  const handleSave = (data: any) => {
    if (editingId) {
      invoiceStorage.update(editingId, { ...data, status: "draft" });
      setEditingId(null);
    } else {
      invoiceStorage.add({ ...data, status: "draft", posted: false, balance_due: data.total, sent_at: null });
    }
    load();
    setIsFormOpen(false);
  };

  // ── Send actions ─────────────────────────────────────────────────────────────
  const handleSend = (byEmail: boolean) => {
    if (!selectedInvoice) return;
    byEmail ? sendInvoice(selectedInvoice.id, true) : markInvoiceAsSent(selectedInvoice.id);
    load();
    setIsSendOpen(false);
    setSelectedInvoice(null);
  };

  // ── Record payment ───────────────────────────────────────────────────────────
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    const bal = selectedInvoice.balance_due ?? selectedInvoice.total;
    recordInvoicePayment(selectedInvoice.id, Math.min(amount, bal), payMethod, payNote || undefined);
    load();
    setIsPaymentOpen(false);
    setPayAmount("");
    setPayMethod("cash");
    setPayNote("");
    setSelectedInvoice(null);
  };

  // ── Void ─────────────────────────────────────────────────────────────────────
  const handleVoid = () => {
    if (!selectedInvoice) return;
    voidInvoice(selectedInvoice.id);
    load();
    setIsVoidOpen(false);
    setSelectedInvoice(null);
  };

  // ── Delete draft ──────────────────────────────────────────────────────────────
  const handleDeleteDraft = (invoice: Invoice) => {
    if (!confirm(`Delete draft ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    deleteDraftInvoice(invoice.id);
    load();
  };

  // ── Open helpers ──────────────────────────────────────────────────────────────
  const openSend = (inv: Invoice) => { setSelectedInvoice(inv); setIsSendOpen(true); };
  const openPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(String((inv.balance_due ?? inv.total).toFixed(2)));
    setIsPaymentOpen(true);
  };
  const openVoid = (inv: Invoice) => { setSelectedInvoice(inv); setIsVoidOpen(true); };
  const openDetail = (inv: Invoice) => { setSelectedInvoice(inv); setIsDetailOpen(true); };
  const openEdit = (inv: Invoice) => { setSelectedInvoice(inv); setEditingId(inv.id); setIsFormOpen(true); };

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your customer invoices</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) { setEditingId(null); setSelectedInvoice(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setSelectedInvoice(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background flex items-center justify-between">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Draft Invoice" : "New Invoice"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
              <div className="max-w-5xl mx-auto p-8">
                <div className="bg-card rounded-xl border border-border shadow-sm p-8">
                  <InvoiceForm
                    invoice={selectedInvoice || undefined}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" form="invoice-form" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                {editingId ? "Update Draft" : "Save as Draft"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by invoice number or customer…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Invoice list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
          </Card>
        ) : (
          filtered.map((invoice) => {
            const effStatus = getEffectiveStatus(invoice);
            const balDue = invoice.balance_due ?? invoice.total;
            const isDraft = invoice.status === "draft";
            const isVoid = invoice.status === "void";
            const isPaid = invoice.status === "paid";
            const isPosted = !isDraft && !isVoid;

            return (
              <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="font-display font-bold text-foreground">{invoice.invoiceNumber}</span>
                      <Badge className={`text-xs ${STATUS_STYLE[effStatus] || STATUS_STYLE.draft}`}>
                        {STATUS_LABEL[effStatus] || effStatus}
                      </Badge>
                      {invoice.sent_at && (
                        <span className="text-[11px] text-muted-foreground">
                          Emailed {new Date(invoice.sent_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.customerName} · Due {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-semibold text-foreground">
                        ${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      {isPosted && balDue < invoice.total && balDue > 0 && (
                        <span className="text-xs text-amber-600 font-medium">
                          ${balDue.toFixed(2)} remaining
                        </span>
                      )}
                      {isPosted && balDue === 0 && !isPaid && (
                        <span className="text-xs text-green-600 font-medium">Fully paid</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — vary by status */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {/* View — always */}
                    <Button size="sm" variant="ghost" onClick={() => openDetail(invoice)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>

                    {isDraft && (<>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(invoice)} title="Edit draft">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openSend(invoice)}>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Send
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteDraft(invoice)} title="Delete draft">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </>)}

                    {isPosted && !isPaid && !isVoid && (
                      <Button size="sm" variant="outline" onClick={() => openPayment(invoice)}>
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        Payment
                      </Button>
                    )}

                    {!isDraft && !isVoid && (
                      <Button size="sm" variant="ghost" onClick={() => openVoid(invoice)} title="Void invoice" className="text-slate-400 hover:text-red-500">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Send dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={isSendOpen} onOpenChange={(o) => { setIsSendOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Posting finalises the invoice, locks the invoice number, and records the receivable.
              You can no longer edit line items after posting.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleSend(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Invoice (by email)
              </Button>
              <Button variant="outline" onClick={() => handleSend(false)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Sent (delivered by other means)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              "Send" records a timestamp and flags the invoice as emailed.
              "Mark as Sent" posts it without the email flag.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Record Payment dialog ────────────────────────────────────────────── */}
      <Dialog open={isPaymentOpen} onOpenChange={(o) => { setIsPaymentOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            {selectedInvoice && (
              <p className="text-sm text-muted-foreground">
                Balance due: <strong>${(selectedInvoice.balance_due ?? selectedInvoice.total).toFixed(2)}</strong>
              </p>
            )}
            <div>
              <Label>Amount Received *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={(v: any) => setPayMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Reference number, etc." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                <DollarSign className="h-4 w-4 mr-1.5" />
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Void confirmation dialog ─────────────────────────────────────────── */}
      <Dialog open={isVoidOpen} onOpenChange={(o) => { setIsVoidOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Void Invoice {selectedInvoice?.invoiceNumber}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Voiding cancels the invoice and reverses all inventory changes. The record is
                kept for audit purposes. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsVoidOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleVoid}>
                <Ban className="h-4 w-4 mr-2" />
                Void Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Detail dialog ────────────────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={(o) => { setIsDetailOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <InvoiceDetail invoice={selectedInvoice} />
              {/* Payment history */}
              {invoicePaymentStorage.getByInvoice(selectedInvoice.id).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Payment History</p>
                  <div className="space-y-1.5">
                    {invoicePaymentStorage.getByInvoice(selectedInvoice.id).map(p => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(p.paidAt).toLocaleDateString()} · {p.method.replace("_", " ")}
                          {p.note && ` · ${p.note}`}
                        </span>
                        <span className="font-medium text-green-600">${p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
