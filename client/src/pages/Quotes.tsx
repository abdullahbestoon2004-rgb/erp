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
  Plus, Edit2, Trash2, FileText, CheckCircle, Copy,
  Send, XCircle, Clock, ChevronRight,
} from "lucide-react";
import { Quote, LineItem } from "@/types";
import { quoteStorage, customerStorage, invoiceStorage, duplicateQuote } from "@/lib/storage";
import LineItemsTable from "@/components/LineItemsTable";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_STYLE: Record<string, string> = {
  draft:    "bg-muted text-muted-foreground",
  sent:     "bg-info/10 text-info",
  accepted: "bg-success/12 text-success",
  declined: "bg-destructive/10 text-destructive",
  expired:  "bg-warning/15 text-warning",
  invoiced: "bg-primary/10 text-primary",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", sent: "Sent", accepted: "Accepted",
  declined: "Declined", expired: "Expired", invoiced: "Invoiced",
};

/** A quote is expired if past its expiryDate and still not accepted/invoiced/declined. */
function effectiveStatus(q: Quote): Quote["status"] {
  if (["accepted", "declined", "invoiced", "expired"].includes(q.status)) return q.status;
  const expiry = q.expiryDate ?? q.dueDate;
  if (expiry && expiry < Date.now()) return "expired";
  return q.status;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState<Quote["status"]>("draft");

  useEffect(() => {
    load();
    setCustomers(customerStorage.getAll().filter(c => c.isActive !== false));
  }, []);

  const load = () => setQuotes(quoteStorage.getAll());

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const taxAmount = lineItems.reduce((s, i) => s + (i.amount * i.taxRate) / 100, 0);
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setCustomerId(""); setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setExpiryDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setNotes(""); setTerms(""); setStatus("draft"); setEditingId(null);
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setCustomerName(customers.find(c => c.id === id)?.name ?? "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (lineItems.every(li => !li.itemName)) { toast.error("Add at least one line item"); return; }

    const current = editingId ? quotes.find(q => q.id === editingId) : null;
    const payload = {
      quoteNumber: current?.quoteNumber ?? quoteStorage.getNextNumber(),
      customerId,
      customerName,
      date: new Date(date).getTime(),
      dueDate: new Date(expiryDate).getTime(),
      expiryDate: new Date(expiryDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      notes,
      terms,
      status,
      convertedInvoiceId: current?.convertedInvoiceId,
    };

    if (editingId) {
      quoteStorage.update(editingId, payload);
      toast.success("Quote updated");
    } else {
      quoteStorage.add(payload);
      toast.success("Quote created");
    }
    load(); resetForm(); setIsFormOpen(false);
  };

  const handleEdit = (q: Quote) => {
    setEditingId(q.id);
    setCustomerId(q.customerId);
    setCustomerName(q.customerName);
    setDate(new Date(q.date).toISOString().split("T")[0]);
    const expiry = q.expiryDate ?? q.dueDate;
    setExpiryDate(new Date(expiry).toISOString().split("T")[0]);
    setLineItems(q.lineItems);
    setNotes(q.notes ?? "");
    setTerms(q.terms ?? "");
    setStatus(q.status);
    setIsFormOpen(true);
  };

  const handleDelete = (q: Quote) => {
    if (!confirm(`Delete quote ${q.quoteNumber}? This cannot be undone.`)) return;
    quoteStorage.delete(q.id);
    toast.success("Quote deleted");
    load();
  };

  const handleConvert = (q: Quote) => {
    if (q.convertedInvoiceId) {
      toast.info("Already converted — invoice already exists for this quote.");
      return;
    }
    const inv = invoiceStorage.add({
      invoiceNumber: invoiceStorage.getNextNumber(),
      customerId: q.customerId,
      customerName: q.customerName,
      date: Date.now(),
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      lineItems: q.lineItems,
      subtotal: q.subtotal,
      taxAmount: q.taxAmount,
      total: q.total,
      balance_due: q.total,
      posted: false,
      sent_at: null,
      notes: q.notes ?? "",
      terms: q.terms,
      status: "draft",
      sourceQuoteId: q.id,
    });
    quoteStorage.update(q.id, { status: "invoiced", convertedInvoiceId: inv.id });
    toast.success(`Converted → ${inv.invoiceNumber}`);
    load();
  };

  const handleMarkStatus = (q: Quote, s: Quote["status"]) => {
    quoteStorage.update(q.id, { status: s });
    toast.success(`Quote marked as ${STATUS_LABEL[s] ?? s}`);
    load();
  };

  const handleDuplicate = (q: Quote) => {
    const copy = duplicateQuote(q.id);
    if (copy) toast.success(`Duplicated → ${copy.quoteNumber}`);
    load();
  };

  const filtered = quotes
    .filter(q => filterStatus === "all" || effectiveStatus(q) === filterStatus)
    .filter(q =>
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const counts: Record<string, number> = { all: quotes.length };
  quotes.forEach(q => {
    const s = effectiveStatus(q);
    counts[s] = (counts[s] ?? 0) + 1;
  });

  const statusFilters: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "accepted", label: "Accepted" },
    { key: "declined", label: "Declined" },
    { key: "expired", label: "Expired" },
    { key: "invoiced", label: "Invoiced" },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Quotes</h1>
          <p className="text-muted-foreground mt-1">Send professional quotes to your customers</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={o => { setIsFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Quote" : "Create New Quote"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 bg-muted/30 dark:bg-muted/10">
              <div className="max-w-5xl mx-auto bg-card p-8 rounded-2xl shadow-sm">
                <form id="quote-form" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer *</Label>
                      <Select value={customerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}{c.companyName ? ` — ${c.companyName}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="invoiced">Invoiced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quote Date</Label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Line Items *</Label>
                    <LineItemsTable value={lineItems} onChange={setLineItems} />
                  </div>

                  {/* Totals */}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Notes visible to customer…" rows={3} />
                    </div>
                    <div>
                      <Label>Terms & Conditions</Label>
                      <Textarea value={terms} onChange={e => setTerms(e.target.value)}
                        placeholder="Payment terms, delivery conditions…" rows={3} />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="quote-form">
                {editingId ? "Update Quote" : "Create Quote"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + status filter chips */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by quote number or customer…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-1">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
              {counts[f.key] ? ` (${counts[f.key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No quotes found</p>
          </Card>
        ) : (
          filtered.map(q => {
            const eff = effectiveStatus(q);
            const expiry = q.expiryDate ?? q.dueDate;
            return (
              <Card key={q.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-foreground font-mono text-sm">{q.quoteNumber}</span>
                      <Badge className={STATUS_STYLE[eff] ?? STATUS_STYLE.draft}>
                        {STATUS_LABEL[eff] ?? eff}
                      </Badge>
                      {q.convertedInvoiceId && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          Invoice created
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {q.customerName} · {new Date(q.date).toLocaleDateString()}
                      {expiry && ` · Expires ${new Date(expiry).toLocaleDateString()}`}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">${fmt(q.total)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    {/* Convert to Invoice — only if not yet converted */}
                    {eff !== "invoiced" && eff !== "declined" && (
                      <Button size="sm" variant="outline"
                        className="text-xs"
                        onClick={() => handleConvert(q)}>
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Convert
                      </Button>
                    )}

                    {/* Quick-status marks */}
                    {eff === "sent" && (
                      <>
                        <Button size="sm" variant="ghost"
                          className="text-success hover:bg-success/10"
                          onClick={() => handleMarkStatus(q, "accepted")}
                          title="Mark Accepted">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleMarkStatus(q, "declined")}
                          title="Mark Declined">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {eff === "draft" && (
                      <Button size="sm" variant="ghost"
                        className="text-info hover:bg-info/10"
                        onClick={() => handleMarkStatus(q, "sent")}
                        title="Mark Sent">
                        <Send className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Duplicate */}
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(q)} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>

                    {/* Edit */}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(q)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(q)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
