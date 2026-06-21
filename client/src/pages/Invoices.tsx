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
  Plus, Edit2, Send, CheckCircle, DollarSign,
  Ban, Trash2, FileText, AlertCircle, X, ChevronRight,
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

// ─── status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  draft:          "bg-slate-100 text-slate-600",
  sent:           "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid:           "bg-green-100 text-green-700",
  overdue:        "bg-red-100 text-red-700",
  void:           "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  draft:          "Draft",
  sent:           "Sent",
  partially_paid: "Partially Paid",
  paid:           "Paid",
  overdue:        "Overdue",
  void:           "Void",
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── component ────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isClosingPreview, setIsClosingPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // form / action dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<InvoicePayment["method"]>("cash");
  const [payNote, setPayNote] = useState("");

  const load = () => {
    // newest first
    const all = invoiceStorage.getAll().sort((a, b) => b.createdAt - a.createdAt);
    setInvoices(all);
    // keep preview in sync after mutations
    setPreviewInvoice(prev => prev ? (all.find(i => i.id === prev.id) ?? null) : null);
  };

  // Animate the preview out before unmounting (250 ms matches CSS transition)
  const closePreview = () => {
    setIsClosingPreview(true);
    setTimeout(() => {
      setPreviewInvoice(null);
      setIsClosingPreview(false);
    }, 250);
  };

  const togglePreview = (invoice: Invoice) => {
    if (previewInvoice?.id === invoice.id && !isClosingPreview) {
      closePreview();
    } else {
      // cancel any in-progress close and show the new invoice immediately
      setIsClosingPreview(false);
      setPreviewInvoice(invoice);
    }
  };

  useEffect(() => { load(); }, []);

  // ── save draft ───────────────────────────────────────────────────────────────
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

  // ── send ──────────────────────────────────────────────────────────────────────
  const handleSend = (byEmail: boolean) => {
    if (!selectedInvoice) return;
    byEmail ? sendInvoice(selectedInvoice.id, true) : markInvoiceAsSent(selectedInvoice.id);
    load();
    setIsSendOpen(false);
    setSelectedInvoice(null);
  };

  // ── payment ───────────────────────────────────────────────────────────────────
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    const bal = selectedInvoice.balance_due ?? selectedInvoice.total;
    recordInvoicePayment(selectedInvoice.id, Math.min(amount, bal), payMethod, payNote || undefined);
    load();
    setIsPaymentOpen(false);
    setPayAmount(""); setPayMethod("cash"); setPayNote("");
    setSelectedInvoice(null);
  };

  // ── void ──────────────────────────────────────────────────────────────────────
  const handleVoid = () => {
    if (!selectedInvoice) return;
    voidInvoice(selectedInvoice.id);
    load();
    setIsVoidOpen(false);
    setSelectedInvoice(null);
  };

  // ── delete draft ──────────────────────────────────────────────────────────────
  const handleDeleteDraft = (invoice: Invoice) => {
    if (!confirm(`Delete draft ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    deleteDraftInvoice(invoice.id);
    if (previewInvoice?.id === invoice.id) closePreview();
    load();
  };

  // ── action openers ────────────────────────────────────────────────────────────
  const openSend = (inv: Invoice) => { setSelectedInvoice(inv); setIsSendOpen(true); };
  const openPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(((inv.balance_due ?? inv.total)).toFixed(2));
    setIsPaymentOpen(true);
  };
  const openVoid = (inv: Invoice) => { setSelectedInvoice(inv); setIsVoidOpen(true); };
  const openEdit = (inv: Invoice) => { setSelectedInvoice(inv); setEditingId(inv.id); setIsFormOpen(true); };

  const filtered = invoices
    .filter(inv => statusFilter === "all" || getEffectiveStatus(inv) === statusFilter)
    .filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Summary stats (always over full unfiltered list)
  const summaryStats = {
    outstanding: invoices.filter(i => ["sent", "partially_paid"].includes(i.status)).reduce((s, i) => s + (i.balance_due ?? i.total), 0),
    overdue:     invoices.filter(i => getEffectiveStatus(i) === "overdue").length,
    paid:        invoices.filter(i => i.status === "paid").length,
    draft:       invoices.filter(i => i.status === "draft").length,
  };

  // Status filter tabs with counts
  const filterTabs: { key: string; label: string; count: number }[] = [
    { key: "all",           label: "All",          count: invoices.length },
    { key: "draft",         label: "Draft",         count: summaryStats.draft },
    { key: "sent",          label: "Sent",          count: invoices.filter(i => getEffectiveStatus(i) === "sent").length },
    { key: "overdue",       label: "Overdue",       count: summaryStats.overdue },
    { key: "partially_paid",label: "Partial",       count: invoices.filter(i => i.status === "partially_paid").length },
    { key: "paid",          label: "Paid",          count: summaryStats.paid },
    { key: "void",          label: "Void",          count: invoices.filter(i => i.status === "void").length },
  ].filter(t => t.key === "all" || t.count > 0); // hide empty tabs

  // true while the panel is visible (either fully open or animating out)
  const isPreviewing = !!previewInvoice;
  // drives CSS: narrow list + show panel
  const showNarrow = isPreviewing && !isClosingPreview;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
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

      {/* ── Summary stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Outstanding",  value: `$${summaryStats.outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-amber-600 dark:text-amber-400" },
          { label: "Overdue",      value: summaryStats.overdue,   color: "text-red-600 dark:text-red-400" },
          { label: "Paid",         value: summaryStats.paid,      color: "text-green-600 dark:text-green-400" },
          { label: "Drafts",       value: summaryStats.draft,     color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + filter tabs ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Input
          placeholder="Search by invoice number or customer…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); if (previewInvoice) closePreview(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Split layout ─────────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* ── Invoice list — transitions between 360 px and 100% ─────────── */}
        <div className={`flex flex-col gap-2 shrink-0 transition-[width] duration-300 ease-in-out ${showNarrow ? "w-[360px]" : "w-full"}`}>
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
              const isActive = !isClosingPreview && previewInvoice?.id === invoice.id;

              return (
                <Card
                  key={invoice.id}
                  onClick={() => togglePreview(invoice)}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isActive
                      ? "border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm"
                      : "hover:border-slate-300"
                  } ${showNarrow ? "p-3" : "p-4"}`}
                >
                  {showNarrow ? (
                    /* ── Compact card (preview open) ── */
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{invoice.invoiceNumber}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_STYLE[effStatus]}`}>
                            {STATUS_LABEL[effStatus]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{invoice.customerName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-foreground">${fmt(invoice.total)}</span>
                          {!isDraft && balDue > 0 && balDue < invoice.total && (
                            <span className="text-[10px] text-amber-600">${fmt(balDue)} due</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-colors ${isActive ? "text-blue-500" : "text-slate-300"}`} />
                    </div>
                  ) : (
                    /* ── Full card (no preview) ── */
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-display font-bold text-foreground">{invoice.invoiceNumber}</span>
                          <Badge className={`text-xs ${STATUS_STYLE[effStatus]}`}>
                            {STATUS_LABEL[effStatus]}
                          </Badge>
                          {invoice.sent_at && (
                            <span className="text-[11px] text-muted-foreground">
                              Sent {new Date(invoice.sent_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.customerName} · Due {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-semibold text-foreground">${fmt(invoice.total)}</span>
                          {!isDraft && balDue < invoice.total && balDue > 0 && (
                            <span className="text-xs text-amber-600 font-medium">${fmt(balDue)} remaining</span>
                          )}
                        </div>
                      </div>
                      {/* Action buttons — stop propagation so they don't toggle the preview */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {isDraft && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(invoice)} title="Edit draft">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => openSend(invoice)}>
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Send
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteDraft(invoice)} title="Delete draft">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
                        {!isDraft && invoice.status !== "void" && invoice.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => openPayment(invoice)}>
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            Payment
                          </Button>
                        )}
                        {!isDraft && invoice.status !== "void" && (
                          <Button size="sm" variant="ghost" onClick={() => openVoid(invoice)} title="Void" className="text-slate-400 hover:text-red-500">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* ── Preview pane — slides in, fades out ───────────────────────── */}
        {isPreviewing && previewInvoice && (() => {
          const inv = previewInvoice;
          const effStatus = getEffectiveStatus(inv);
          const balDue = inv.balance_due ?? inv.total;
          const isDraft = inv.status === "draft";
          const payments = invoicePaymentStorage.getByInvoice(inv.id);

          return (
            <div
              className={`flex-1 min-w-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-all duration-250 ease-in-out ${
                isClosingPreview
                  ? "opacity-0 translate-x-4 pointer-events-none"
                  : "opacity-100 translate-x-0"
              }`}
              style={{ maxHeight: "calc(100vh - 220px)", position: "sticky", top: "80px" }}
            >
              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background shrink-0">
                <div>
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <span className="font-display font-bold text-lg text-foreground">{inv.invoiceNumber}</span>
                    <Badge className={`text-xs ${STATUS_STYLE[effStatus]}`}>{STATUS_LABEL[effStatus]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{inv.customerName}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={closePreview} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-slate-50/60 dark:bg-slate-900/40 shrink-0 flex-wrap">
                {isDraft && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openEdit(inv)}>
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openSend(inv)}>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Send Invoice
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDeleteDraft(inv)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </>
                )}
                {!isDraft && inv.status !== "void" && inv.status !== "paid" && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openPayment(inv)}>
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                    Record Payment
                  </Button>
                )}
                {!isDraft && inv.status !== "void" && (
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-500 ml-auto" onClick={() => openVoid(inv)}>
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Void
                  </Button>
                )}
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Invoice Date", value: new Date(inv.date).toLocaleDateString() },
                    { label: "Due Date", value: new Date(inv.dueDate).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Line items */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr className="border-b border-border">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Item</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Qty</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Rate</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inv.lineItems.map(li => (
                          <tr key={li.id}>
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-foreground">{li.itemName}</p>
                              {li.description && <p className="text-xs text-muted-foreground">{li.description}</p>}
                            </td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground">{li.quantity}</td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground">${fmt(li.unitPrice)}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">${fmt(li.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-border space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${fmt(inv.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>${fmt(inv.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2 text-foreground">
                    <span>Total</span>
                    <span>${fmt(inv.total)}</span>
                  </div>
                  {!isDraft && balDue < inv.total && (
                    <div className="flex justify-between font-semibold text-amber-600 border-t border-dashed border-amber-200 pt-2">
                      <span>Balance Due</span>
                      <span>${fmt(balDue)}</span>
                    </div>
                  )}
                  {!isDraft && balDue === 0 && (
                    <div className="flex justify-between font-semibold text-green-600 border-t border-dashed border-green-200 pt-2">
                      <span>Balance Due</span>
                      <span>$0.00 — Paid in Full</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {inv.notes && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
                    <p className="text-sm text-foreground">{inv.notes}</p>
                  </div>
                )}

                {/* Payment history */}
                {payments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment History</p>
                    <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                      {payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium capitalize">{p.method.replace("_", " ")}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(p.paidAt).toLocaleDateString()}
                              {p.note && ` · ${p.note}`}
                            </p>
                          </div>
                          <span className="font-semibold text-green-600">+${fmt(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>

      {/* ── Send dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={isSendOpen} onOpenChange={(o) => { setIsSendOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Post Invoice {selectedInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Posting finalises the invoice, locks the number, and records the receivable. Line items cannot be edited after posting.
            </p>
            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleSend(true)}>
                <Send className="h-4 w-4 mr-2" />Send Invoice (by email)
              </Button>
              <Button className="w-full" variant="outline" onClick={() => handleSend(false)}>
                <CheckCircle className="h-4 w-4 mr-2" />Mark as Sent (delivered by other means)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Record Payment dialog ─────────────────────────────────────────────── */}
      <Dialog open={isPaymentOpen} onOpenChange={(o) => { setIsPaymentOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment — {selectedInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            {selectedInvoice && (
              <p className="text-sm text-muted-foreground">
                Balance due: <strong>${fmt(selectedInvoice.balance_due ?? selectedInvoice.total)}</strong>
              </p>
            )}
            <div>
              <Label>Amount Received *</Label>
              <Input type="number" step="0.01" min="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" required />
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
              <Input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Reference number, etc." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                <DollarSign className="h-4 w-4 mr-1.5" />Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Void confirmation ────────────────────────────────────────────────── */}
      <Dialog open={isVoidOpen} onOpenChange={(o) => { setIsVoidOpen(o); if (!o) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Void Invoice {selectedInvoice?.invoiceNumber}?</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Voiding cancels the invoice and reverses inventory changes. The record is kept for audit purposes and cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsVoidOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleVoid}>
                <Ban className="h-4 w-4 mr-2" />Void Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
