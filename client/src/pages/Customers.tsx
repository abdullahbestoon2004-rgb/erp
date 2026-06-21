import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Customer } from "@/types";
import {
  customerStorage,
  invoiceStorage,
  quoteStorage,
  salesReceiptStorage,
  creditNoteStorage,
  paymentReceivedStorage,
  deactivateCustomer,
  reactivateCustomer,
  getCustomerReceivables,
  getCustomerUnusedCredits,
} from "@/lib/storage";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── component ────────────────────────────────────────────────────────────────

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterStatus, setFilterStatus] = useState<"active" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    taxId: "",
    openingBalance: "",
  });

  // Detail view
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "transactions">("overview");

  useEffect(() => { load(); }, []);

  const load = () => setCustomers(customerStorage.getAll());

  const resetForm = () => {
    setFormData({ name: "", companyName: "", email: "", phone: "", address: "",
      city: "", state: "", zipCode: "", country: "", taxId: "", openingBalance: "" });
    setEditingId(null);
  };

  const handleEdit = (c: Customer) => {
    setFormData({
      name: c.name,
      companyName: c.companyName ?? "",
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      state: c.state,
      zipCode: c.zipCode,
      country: c.country,
      taxId: c.taxId ?? "",
      openingBalance: c.openingBalance != null ? String(c.openingBalance) : "",
    });
    setEditingId(c.id);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      companyName: formData.companyName.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      country: formData.country.trim(),
      taxId: formData.taxId.trim() || undefined,
      openingBalance: formData.openingBalance ? parseFloat(formData.openingBalance) : undefined,
      isActive: true,
    };

    if (editingId) {
      customerStorage.update(editingId, payload);
      toast.success("Customer updated");
    } else {
      customerStorage.add(payload);
      toast.success("Customer added");
    }
    load();
    resetForm();
    setIsFormOpen(false);
  };

  const handleDeactivate = (c: Customer) => {
    if (c.isActive === false) {
      reactivateCustomer(c.id);
      toast.success(`${c.name} reactivated`);
      load();
      return;
    }
    if (!confirm(`Deactivate ${c.name}? Customers with linked transactions are soft-deleted (kept for records).`)) return;
    deactivateCustomer(c.id);
    toast.success(`${c.name} deactivated`);
    load();
    if (selectedCustomer?.id === c.id) setIsDetailOpen(false);
  };

  const handleDelete = (c: Customer) => {
    const hasLinks =
      invoiceStorage.getAll().some(i => i.customerId === c.id) ||
      quoteStorage.getAll().some(q => q.customerId === c.id);
    if (hasLinks) {
      toast.error("Cannot delete — customer has linked transactions. Deactivate instead.");
      return;
    }
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    customerStorage.delete(c.id);
    toast.success("Customer deleted");
    load();
    if (selectedCustomer?.id === c.id) setIsDetailOpen(false);
  };

  const handleOpenDetail = (c: Customer) => {
    setSelectedCustomer(c);
    setDetailTab("overview");
    setIsDetailOpen(true);
  };

  // ── data helpers ──────────────────────────────────────────────────────────
  const getCustomerStats = (customerId: string) => {
    const invoices = invoiceStorage.getAll().filter(i => i.customerId === customerId);
    const receivables = getCustomerReceivables(customerId);
    const unusedCredits = getCustomerUnusedCredits(customerId);
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const openInvoices = invoices.filter(i => !["paid", "void"].includes(i.status)).length;
    return { totalInvoiced, receivables, unusedCredits, openInvoices };
  };

  const getCustomerTransactions = (customerId: string) => {
    type Row = { type: string; number: string; date: number; amount: number; status: string };
    const rows: Row[] = [];

    invoiceStorage.getAll()
      .filter(i => i.customerId === customerId)
      .forEach(i => rows.push({ type: "Invoice", number: i.invoiceNumber, date: i.date, amount: i.total, status: i.status }));

    quoteStorage.getAll()
      .filter(q => q.customerId === customerId)
      .forEach(q => rows.push({ type: "Quote", number: q.quoteNumber, date: q.date, amount: q.total, status: q.status }));

    salesReceiptStorage.getAll()
      .filter(r => r.customerId === customerId)
      .forEach(r => rows.push({ type: "Sales Receipt", number: r.receiptNumber, date: r.date, amount: r.total, status: r.status }));

    creditNoteStorage.getAll()
      .filter(c => c.customerId === customerId)
      .forEach(c => rows.push({ type: "Credit Note", number: c.creditNoteNumber, date: c.date, amount: c.total, status: c.status }));

    paymentReceivedStorage.getAll()
      .filter(p => p.customerId === customerId)
      .forEach(p => rows.push({ type: "Payment", number: p.paymentNumber, date: p.date, amount: p.amount, status: "received" }));

    return rows.sort((a, b) => b.date - a.date);
  };

  // ── filter ────────────────────────────────────────────────────────────────
  const visible = customers
    .filter(c => filterStatus === "all" || c.isActive !== false)
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const typeColors: Record<string, string> = {
    Invoice: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Quote: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    "Sales Receipt": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "Credit Note": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    Payment: "bg-green-500/10 text-green-600 dark:text-green-400",
  };

  const statusColors: Record<string, string> = {
    paid: "bg-green-500/10 text-green-600",
    sent: "bg-blue-500/10 text-blue-600",
    overdue: "bg-red-500/10 text-red-600",
    draft: "bg-muted text-muted-foreground",
    accepted: "bg-green-500/10 text-green-600",
    declined: "bg-red-500/10 text-red-600",
    invoiced: "bg-purple-500/10 text-purple-600",
    received: "bg-green-500/10 text-green-600",
    open: "bg-amber-500/10 text-amber-600",
    closed: "bg-muted text-muted-foreground",
    void: "bg-muted text-muted-foreground",
    completed: "bg-green-500/10 text-green-600",
  };

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">
            {customers.filter(c => c.isActive !== false).length} active
            {customers.filter(c => c.isActive === false).length > 0 &&
              ` · ${customers.filter(c => c.isActive === false).length} inactive`}
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={o => { setIsFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-muted/30 dark:bg-muted/10">
              <div className="max-w-3xl mx-auto bg-card p-8 rounded-2xl shadow-sm">
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Contact name" />
                    </div>
                    <div>
                      <Label>Company Name</Label>
                      <Input value={formData.companyName}
                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Business / organisation" />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000" />
                    </div>
                    <div>
                      <Label>Tax ID</Label>
                      <Input value={formData.taxId}
                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="VAT / GST / EIN" />
                    </div>
                    <div>
                      <Label>Opening Balance ($)</Label>
                      <Input type="number" step="0.01" min="0" value={formData.openingBalance}
                        onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                        placeholder="0.00" />
                    </div>
                    <div className="col-span-2">
                      <Label>Billing Address</Label>
                      <Input value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street address" />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City" />
                    </div>
                    <div>
                      <Label>State / Province</Label>
                      <Input value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State" />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input value={formData.zipCode}
                        onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="Zip / Postal code" />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Country" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingId ? "Update Customer" : "Add Customer"}</Button>
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, company, or email…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {(["active", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${
                filterStatus === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.length === 0 ? (
          <Card className="p-10 col-span-full text-center">
            <User className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No customers found</p>
          </Card>
        ) : (
          visible.map(c => {
            const receivables = getCustomerReceivables(c.id);
            const isInactive = c.isActive === false;
            return (
              <Card
                key={c.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                  isInactive ? "opacity-60" : ""
                }`}
                onClick={() => handleOpenDetail(c)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                      {c.companyName && (
                        <p className="text-xs text-muted-foreground truncate">{c.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {isInactive && <Badge variant="outline" className="text-xs mr-1">Inactive</Badge>}
                    <Button size="icon-sm" variant="ghost" onClick={() => handleEdit(c)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost"
                      onClick={() => handleDeactivate(c)}
                      title={isInactive ? "Reactivate" : "Deactivate"}>
                      {isInactive
                        ? <UserCheck className="h-3.5 w-3.5 text-green-500" />
                        : <UserX className="h-3.5 w-3.5 text-amber-500" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {c.phone}
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.address}, {c.city}</span>
                    </div>
                  )}
                </div>

                {receivables > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      ${fmt(receivables)}
                    </span>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Customer Detail */}
      {selectedCustomer && (
        <Dialog open={isDetailOpen} onOpenChange={o => { setIsDetailOpen(o); if (!o) setSelectedCustomer(null); }}>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-display font-bold">
                      {selectedCustomer.name}
                    </DialogTitle>
                    {selectedCustomer.companyName && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.companyName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => { setIsDetailOpen(false); handleEdit(selectedCustomer); }}>
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    onClick={() => handleDeactivate(selectedCustomer)}>
                    {selectedCustomer.isActive === false
                      ? <><UserCheck className="h-4 w-4 mr-1.5" />Reactivate</>
                      : <><UserX className="h-4 w-4 mr-1.5" />Deactivate</>}
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(selectedCustomer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex border-b border-border bg-background shrink-0 px-6">
              {(["overview", "transactions"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                    detailTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="max-w-4xl mx-auto space-y-6">

                {/* OVERVIEW */}
                {detailTab === "overview" && (() => {
                  const stats = getCustomerStats(selectedCustomer.id);
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Total Invoiced", value: `$${fmt(stats.totalInvoiced)}`, icon: FileText, color: "text-foreground" },
                          { label: "Receivables", value: `$${fmt(stats.receivables)}`, icon: TrendingUp, color: stats.receivables > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground" },
                          { label: "Unused Credits", value: `$${fmt(stats.unusedCredits)}`, icon: CreditCard, color: stats.unusedCredits > 0 ? "text-green-600 dark:text-green-400" : "text-foreground" },
                          { label: "Open Invoices", value: String(stats.openInvoices), icon: DollarSign, color: "text-foreground" },
                        ].map(s => (
                          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-sm">
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-card rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Contact Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="font-medium">{selectedCustomer.email}</p>
                            </div>
                          </div>
                          {selectedCustomer.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-medium">{selectedCustomer.phone}</p>
                              </div>
                            </div>
                          )}
                          {selectedCustomer.taxId && (
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Tax ID</p>
                                <p className="font-medium">{selectedCustomer.taxId}</p>
                              </div>
                            </div>
                          )}
                          {selectedCustomer.openingBalance != null && (
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Opening Balance</p>
                                <p className="font-medium">${fmt(selectedCustomer.openingBalance)}</p>
                              </div>
                            </div>
                          )}
                          {selectedCustomer.address && (
                            <div className="flex items-start gap-3 md:col-span-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Billing Address</p>
                                <p className="font-medium">
                                  {selectedCustomer.address}
                                  {selectedCustomer.city && `, ${selectedCustomer.city}`}
                                  {selectedCustomer.state && `, ${selectedCustomer.state}`}
                                  {selectedCustomer.zipCode && ` ${selectedCustomer.zipCode}`}
                                  {selectedCustomer.country && `, ${selectedCustomer.country}`}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Customer Since</p>
                              <p className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* TRANSACTIONS */}
                {detailTab === "transactions" && (() => {
                  const txns = getCustomerTransactions(selectedCustomer.id);
                  if (txns.length === 0) {
                    return (
                      <div className="bg-card rounded-2xl p-16 text-center shadow-sm">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="font-medium text-muted-foreground">No transactions yet</p>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border">
                          <tr>
                            {["Type", "Reference", "Date", "Amount", "Status"].map(h => (
                              <th key={h} className={`px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {txns.map((txn, idx) => (
                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[txn.type] ?? "bg-muted text-muted-foreground"}`}>
                                  {txn.type}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-xs">{txn.number}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</td>
                              <td className="px-5 py-3.5 text-right font-semibold">${fmt(txn.amount)}</td>
                              <td className="px-5 py-3.5 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[txn.status] ?? "bg-muted text-muted-foreground"}`}>
                                  {txn.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-border bg-muted/30">
                          <tr>
                            <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-muted-foreground">Total</td>
                            <td className="px-5 py-3 text-right font-bold">${fmt(txns.reduce((s, t) => s + t.amount, 0))}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}

              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
