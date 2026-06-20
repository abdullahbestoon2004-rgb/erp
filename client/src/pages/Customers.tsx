import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, FileText, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types";
import { customerStorage, invoiceStorage, quoteStorage, salesReceiptStorage, creditNoteStorage } from "@/lib/storage";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detail view state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "transactions">("overview");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    taxId: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    setCustomers(customerStorage.getAll());
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      taxId: "",
    });
    setEditingId(null);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      country: customer.country,
      taxId: customer.taxId || "",
    });
    setEditingId(customer.id);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Name and email are required");
      return;
    }

    if (editingId) {
      customerStorage.update(editingId, formData);
    } else {
      customerStorage.add(formData);
    }

    loadCustomers();
    resetForm();
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      customerStorage.delete(id);
      loadCustomers();
      if (selectedCustomer?.id === id) setIsDetailOpen(false);
    }
  };

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailTab("overview");
    setIsDetailOpen(true);
  };

  const getCustomerTransactions = (customerId: string) => {
    type TxRow = { type: string; number: string; date: number; amount: number; status: string };
    const rows: TxRow[] = [];

    invoiceStorage.getAll()
      .filter(i => i.customerId === customerId)
      .forEach(i => rows.push({ type: "Invoice", number: i.invoiceNumber, date: i.date, amount: i.total, status: i.status }));

    quoteStorage.getAll()
      .filter(q => q.customerId === customerId)
      .forEach(q => rows.push({ type: "Quote", number: q.quoteNumber, date: q.date, amount: q.total, status: q.status }));

    salesReceiptStorage.getAll()
      .filter((r: any) => r.customerId === customerId)
      .forEach((r: any) => rows.push({ type: "Sales Receipt", number: r.receiptNumber || r.id, date: r.date, amount: r.total || 0, status: "paid" }));

    creditNoteStorage.getAll()
      .filter((c: any) => c.customerId === customerId)
      .forEach((c: any) => rows.push({ type: "Credit Note", number: c.creditNoteNumber || c.id, date: c.date, amount: c.total || 0, status: c.status || "issued" }));

    return rows.sort((a, b) => b.date - a.date);
  };

  const getCustomerStats = (customerId: string) => {
    const invoices = invoiceStorage.getAll().filter(i => i.customerId === customerId);
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
    const outstanding = totalInvoiced - totalPaid;
    const openCount = invoices.filter(i => !["paid"].includes(i.status)).length;
    return { totalInvoiced, totalPaid, outstanding, openCount };
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer contacts</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen>
            <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/20">
              <div className="max-w-3xl mx-auto bg-card p-8 rounded-xl border border-border shadow-sm">
                <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                    placeholder="Tax ID"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label>Zip Code</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    placeholder="Zip code"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? "Update Customer" : "Add Customer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
        </Dialog>
      </div>

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-display font-bold">{selectedCustomer.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => { setIsDetailOpen(false); handleEdit(selectedCustomer); }}>
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleDelete(selectedCustomer.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Tab bar */}
            <div className="flex border-b border-border bg-background shrink-0 px-6">
              {(["overview", "transactions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                    detailTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="max-w-4xl mx-auto space-y-6">

                {/* OVERVIEW TAB */}
                {detailTab === "overview" && (() => {
                  const stats = getCustomerStats(selectedCustomer.id);
                  return (
                    <>
                      {/* Stats row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Total Invoiced", value: `$${stats.totalInvoiced.toFixed(2)}`, color: "text-foreground" },
                          { label: "Total Paid", value: `$${stats.totalPaid.toFixed(2)}`, color: "text-green-600 dark:text-green-400" },
                          { label: "Outstanding", value: `$${stats.outstanding.toFixed(2)}`, color: stats.outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground" },
                          { label: "Open Invoices", value: stats.openCount.toString(), color: "text-foreground" },
                        ].map((s) => (
                          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Contact details */}
                      <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Contact Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
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
                          {selectedCustomer.address && (
                            <div className="flex items-start gap-3 md:col-span-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Address</p>
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

                {/* TRANSACTIONS TAB */}
                {detailTab === "transactions" && (() => {
                  const txns = getCustomerTransactions(selectedCustomer.id);
                  const typeColors: Record<string, string> = {
                    "Invoice": "bg-green-100 text-green-700",
                    "Quote": "bg-blue-100 text-blue-700",
                    "Sales Receipt": "bg-emerald-100 text-emerald-700",
                    "Credit Note": "bg-red-100 text-red-700",
                  };
                  const statusColors: Record<string, string> = {
                    "paid": "bg-green-100 text-green-700",
                    "sent": "bg-blue-100 text-blue-700",
                    "viewed": "bg-blue-100 text-blue-700",
                    "overdue": "bg-red-100 text-red-700",
                    "draft": "bg-gray-100 text-gray-700",
                    "accepted": "bg-green-100 text-green-700",
                    "declined": "bg-red-100 text-red-700",
                    "invoiced": "bg-purple-100 text-purple-700",
                    "issued": "bg-blue-100 text-blue-700",
                  };
                  if (txns.length === 0) {
                    return (
                      <div className="bg-card rounded-xl border border-border p-16 text-center">
                        <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-medium text-muted-foreground">No transactions yet</p>
                        <p className="text-sm text-muted-foreground mt-1">No invoices, quotes, or receipts found for this customer.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border">
                          <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reference</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                            <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {txns.map((txn, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[txn.type] || "bg-slate-100 text-slate-700"}`}>
                                  {txn.type}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-xs font-medium">{txn.number}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</td>
                              <td className="px-5 py-3.5 text-right font-semibold">${txn.amount.toFixed(2)}</td>
                              <td className="px-5 py-3.5 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[txn.status] || "bg-slate-100 text-slate-700"}`}>
                                  {txn.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-border">
                          <tr>
                            <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-muted-foreground">Total</td>
                            <td className="px-5 py-3 text-right font-bold">${txns.reduce((s, t) => s + t.amount, 0).toFixed(2)}</td>
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

      {/* Search */}
      <Input
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Customers Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {filteredCustomers.length === 0 ? (
            <Card className="p-8 col-span-full text-center">
              <p className="text-muted-foreground">No customers found</p>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="p-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                onClick={() => handleOpenDetail(customer)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-foreground">
                      {customer.name}
                    </h3>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(customer)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(customer.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customer.address}, {customer.city}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
