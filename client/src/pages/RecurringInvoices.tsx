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
  Plus, Edit2, Trash2, Play, Pause, StopCircle,
  Zap, RefreshCw, FileText,
} from "lucide-react";
import { RecurringInvoice, LineItem } from "@/types";
import {
  recurringInvoiceStorage,
  customerStorage,
  generateRecurringInvoice,
} from "@/lib/storage";
import LineItemsTable from "@/components/LineItemsTable";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_STYLE: Record<string, string> = {
  active:  "bg-success/12 text-success",
  paused:  "bg-warning/15 text-warning",
  stopped: "bg-destructive/10 text-destructive",
};

const FREQ_LABEL: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly",
};

// ─── component ────────────────────────────────────────────────────────────────

export default function RecurringInvoices() {
  const [profiles, setProfiles] = useState<RecurringInvoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [profileName, setProfileName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [frequency, setFrequency] = useState<RecurringInvoice["frequency"]>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [repeatCount, setRepeatCount] = useState("");
  const [nextInvoiceDate, setNextInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [status, setStatus] = useState<RecurringInvoice["status"]>("active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    load();
    setCustomers(customerStorage.getAll().filter(c => c.isActive !== false));
  }, []);

  const load = () => setProfiles(recurringInvoiceStorage.getAll());

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const taxAmount = lineItems.reduce((s, i) => s + (i.amount * i.taxRate) / 100, 0);
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setProfileName(""); setCustomerId(""); setCustomerName("");
    setFrequency("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(""); setRepeatCount("");
    setNextInvoiceDate(new Date().toISOString().split("T")[0]);
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setStatus("active"); setNotes(""); setEditingId(null);
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setCustomerName(customers.find(c => c.id === id)?.name ?? "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (lineItems.every(li => !li.itemName)) { toast.error("Add at least one line item"); return; }

    const payload = {
      profileName: profileName || undefined,
      customerId,
      customerName,
      frequency,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      repeatCount: repeatCount ? parseInt(repeatCount) : undefined,
      nextInvoiceDate: new Date(nextInvoiceDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      status,
    };

    if (editingId) {
      recurringInvoiceStorage.update(editingId, payload);
      toast.success("Recurring profile updated");
    } else {
      recurringInvoiceStorage.add(payload);
      toast.success("Recurring profile created");
    }
    load(); resetForm(); setIsFormOpen(false);
  };

  const handleEdit = (p: RecurringInvoice) => {
    setEditingId(p.id);
    setProfileName(p.profileName ?? "");
    setCustomerId(p.customerId);
    setCustomerName(p.customerName);
    setFrequency(p.frequency);
    setStartDate(p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "");
    setEndDate(p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "");
    setRepeatCount(p.repeatCount ? String(p.repeatCount) : "");
    setNextInvoiceDate(new Date(p.nextInvoiceDate).toISOString().split("T")[0]);
    setLineItems(p.lineItems);
    setStatus(p.status);
    setIsFormOpen(true);
  };

  const handleDelete = (p: RecurringInvoice) => {
    if (!confirm(`Delete recurring profile for ${p.customerName}?`)) return;
    recurringInvoiceStorage.delete(p.id);
    toast.success("Profile deleted");
    load();
  };

  const handlePauseResume = (p: RecurringInvoice) => {
    const next = p.status === "active" ? "paused" : "active";
    recurringInvoiceStorage.update(p.id, { status: next });
    toast.success(next === "active" ? "Profile resumed" : "Profile paused");
    load();
  };

  const handleStop = (p: RecurringInvoice) => {
    if (!confirm(`Stop this recurring profile? It will no longer generate invoices.`)) return;
    recurringInvoiceStorage.update(p.id, { status: "stopped" });
    toast.success("Profile stopped");
    load();
  };

  const handleGenerate = (p: RecurringInvoice) => {
    const inv = generateRecurringInvoice(p.id);
    if (inv) {
      toast.success(`Invoice ${inv.invoiceNumber} generated`);
      load();
    } else {
      toast.error("Could not generate invoice (profile inactive or stopped)");
    }
  };

  const filtered = profiles
    .filter(p => filterStatus === "all" || p.status === filterStatus)
    .filter(p =>
      (p.profileName ?? p.customerName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "stopped", label: "Stopped" },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Recurring Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Rules that auto-generate invoices on a schedule
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={o => { setIsFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Recurring Profile" : "Create Recurring Profile"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-muted/30 dark:bg-muted/10">
              <div className="max-w-5xl mx-auto bg-card p-8 rounded-2xl shadow-sm">
                <form id="rec-form" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Profile Name</Label>
                      <Input value={profileName} onChange={e => setProfileName(e.target.value)}
                        placeholder="e.g. Monthly SaaS Subscription" />
                    </div>
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
                      <Label>Frequency *</Label>
                      <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Next Invoice Date *</Label>
                      <Input type="date" value={nextInvoiceDate}
                        onChange={e => setNextInvoiceDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>End Date (optional)</Label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Repeat Count (optional — e.g. 12 for a year of monthly)</Label>
                      <Input type="number" min="1" value={repeatCount}
                        onChange={e => setRepeatCount(e.target.value)}
                        placeholder="Leave blank for no limit" />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="stopped">Stopped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Line Items (used for each generated invoice) *</Label>
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
                        <span>Per Invoice</span>
                        <span>${fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="rec-form">
                {editingId ? "Update Profile" : "Create Profile"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by profile name or customer…"
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
            <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No recurring profiles found</p>
          </Card>
        ) : (
          filtered.map(p => {
            const genCount = p.generatedInvoiceIds?.length ?? 0;
            return (
              <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {p.profileName ?? p.customerName}
                      </span>
                      <Badge className={STATUS_STYLE[p.status] ?? STATUS_STYLE.active}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {FREQ_LABEL[p.frequency]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {p.profileName ? p.customerName + " · " : ""}
                      Next: {new Date(p.nextInvoiceDate).toLocaleDateString()}
                      {p.endDate && ` · Ends ${new Date(p.endDate).toLocaleDateString()}`}
                      {p.repeatCount && ` · Max ${p.repeatCount}×`}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-bold text-foreground">${fmt(p.total)} / billing</span>
                      {genCount > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {genCount} invoice{genCount !== 1 ? "s" : ""} generated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    {/* Generate now */}
                    {p.status === "active" && (
                      <Button size="sm" variant="outline"
                        className="text-xs text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => handleGenerate(p)}
                        title="Generate invoice now">
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        Generate Now
                      </Button>
                    )}

                    {/* Pause / Resume */}
                    {p.status !== "stopped" && (
                      <Button size="sm" variant="ghost" onClick={() => handlePauseResume(p)}
                        title={p.status === "active" ? "Pause" : "Resume"}>
                        {p.status === "active"
                          ? <Pause className="h-4 w-4" />
                          : <Play className="h-4 w-4" />}
                      </Button>
                    )}

                    {/* Stop */}
                    {p.status !== "stopped" && (
                      <Button size="sm" variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleStop(p)} title="Stop permanently">
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    )}

                    <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}>
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
