import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Receipt, Users, Building2, TrendingUp,
  Plus, ArrowRight, DollarSign, CheckCircle2, AlertTriangle,
  Clock, Send, ShoppingCart, UserPlus, Store,
} from "lucide-react";
import {
  invoiceStorage,
  billStorage,
  customerStorage,
  vendorStorage,
  getEffectiveStatus,
} from "@/lib/storage";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate] = useLocation();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstanding: 0,
    totalCustomers: 0,
    totalVendors: 0,
    invoicePaid: 0,
    invoiceSent: 0,
    invoiceOverdue: 0,
    invoiceDraft: 0,
    invoiceTotal: 0,
    billPaid: 0,
    billPending: 0,
    billOverdue: 0,
    billTotal: 0,
    recentInvoices: [] as { number: string; customer: string; amount: number; status: string }[],
  });

  useEffect(() => {
    const invoices = invoiceStorage.getAll().sort((a, b) => b.createdAt - a.createdAt);
    const bills    = billStorage.getAll();
    const now      = Date.now();

    let invoicePaid = 0, invoiceSent = 0, invoiceOverdue = 0, invoiceDraft = 0;
    let totalRevenue = 0, outstanding = 0;

    invoices.forEach(inv => {
      const s = getEffectiveStatus(inv);
      if (s === "paid")           { invoicePaid++;    totalRevenue  += inv.total; }
      else if (s === "sent")      { invoiceSent++;    outstanding   += (inv.balance_due ?? inv.total); }
      else if (s === "partially_paid") { invoiceSent++; outstanding += (inv.balance_due ?? 0); }
      else if (s === "overdue")   { invoiceOverdue++; outstanding   += (inv.balance_due ?? inv.total); }
      else if (s === "draft")     { invoiceDraft++; }
    });

    let billPaid = 0, billPending = 0, billOverdue = 0;
    bills.forEach(bill => {
      if ((bill.status as string) === "paid") billPaid++;
      else if (bill.dueDate < now) billOverdue++;
      else billPending++;
    });

    setStats({
      totalRevenue,
      outstanding,
      totalCustomers: customerStorage.getAll().length,
      totalVendors:   vendorStorage.getAll().length,
      invoicePaid, invoiceSent, invoiceOverdue, invoiceDraft,
      invoiceTotal: invoices.length,
      billPaid, billPending, billOverdue,
      billTotal: bills.length,
      recentInvoices: invoices.slice(0, 5).map(inv => ({
        number:   inv.invoiceNumber,
        customer: inv.customerName,
        amount:   inv.total,
        status:   getEffectiveStatus(inv),
      })),
    });
  }, []);

  // ── metric card ─────────────────────────────────────────────────────────────
  const MetricCard = ({
    icon: Icon, label, value, sub, iconClass, bgClass,
  }: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; iconClass: string; bgClass: string;
  }) => (
    <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-display font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </div>
    </Card>
  );

  // ── status row ──────────────────────────────────────────────────────────────
  const StatusRow = ({
    icon: Icon, label, count, total, color,
  }: {
    icon: React.ElementType; label: string; count: number; total: number; color: string;
  }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-semibold text-foreground">{count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-current transition-all duration-500"
              style={{ width: `${pct}%`, color: "inherit" }}
            />
          </div>
        </div>
      </div>
    );
  };

  const invoiceStatusStyle: Record<string, string> = {
    draft:          "bg-slate-100 text-slate-600",
    sent:           "bg-blue-100 text-blue-700",
    partially_paid: "bg-amber-100 text-amber-700",
    paid:           "bg-green-100 text-green-700",
    overdue:        "bg-red-100 text-red-700",
    void:           "bg-gray-100 text-gray-400",
  };

  const statusLabel: Record<string, string> = {
    draft: "Draft", sent: "Sent", partially_paid: "Partial",
    paid: "Paid", overdue: "Overdue", void: "Void",
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7 max-w-[1400px] mx-auto">

      {/* ── Greeting ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            {getGreeting()} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{todayLabel()} · Here's your business overview</p>
        </div>
        <Button className="shrink-0" onClick={() => navigate("/invoices")}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign} label="Revenue Collected"
          value={fmt(stats.totalRevenue)}
          sub={`${stats.invoicePaid} paid invoice${stats.invoicePaid !== 1 ? "s" : ""}`}
          iconClass="text-blue-600" bgClass="bg-blue-50"
        />
        <MetricCard
          icon={TrendingUp} label="Outstanding (AR)"
          value={fmt(stats.outstanding)}
          sub={`${stats.invoiceSent + stats.invoiceOverdue} unpaid invoice${stats.invoiceSent + stats.invoiceOverdue !== 1 ? "s" : ""}`}
          iconClass="text-amber-600" bgClass="bg-amber-50"
        />
        <MetricCard
          icon={Users} label="Customers"
          value={stats.totalCustomers}
          sub="Active accounts"
          iconClass="text-emerald-600" bgClass="bg-emerald-50"
        />
        <MetricCard
          icon={Building2} label="Vendors"
          value={stats.totalVendors}
          sub="Active suppliers"
          iconClass="text-purple-600" bgClass="bg-purple-50"
        />
      </div>

      {/* ── Status + Quick Actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Invoice overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-foreground">Invoices</h3>
            <button onClick={() => navigate("/invoices")}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3.5">
            <StatusRow icon={CheckCircle2}  label="Paid"    count={stats.invoicePaid}    total={stats.invoiceTotal} color="text-green-600 bg-green-50" />
            <StatusRow icon={Send}          label="Sent"    count={stats.invoiceSent}    total={stats.invoiceTotal} color="text-blue-600 bg-blue-50" />
            <StatusRow icon={AlertTriangle} label="Overdue" count={stats.invoiceOverdue} total={stats.invoiceTotal} color="text-red-600 bg-red-50" />
            <StatusRow icon={FileText}      label="Draft"   count={stats.invoiceDraft}   total={stats.invoiceTotal} color="text-slate-500 bg-slate-100" />
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Total</span>
            <span className="font-semibold text-foreground">{stats.invoiceTotal}</span>
          </div>
        </Card>

        {/* Bill overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-foreground">Bills</h3>
            <button onClick={() => navigate("/bills")}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3.5">
            <StatusRow icon={CheckCircle2}  label="Paid"    count={stats.billPaid}    total={stats.billTotal} color="text-green-600 bg-green-50" />
            <StatusRow icon={Clock}         label="Pending" count={stats.billPending} total={stats.billTotal} color="text-blue-600 bg-blue-50" />
            <StatusRow icon={AlertTriangle} label="Overdue" count={stats.billOverdue} total={stats.billTotal} color="text-red-600 bg-red-50" />
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Total</span>
            <span className="font-semibold text-foreground">{stats.billTotal}</span>
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-base text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: FileText,   label: "New Invoice",   desc: "Bill a customer",          path: "/invoices",  color: "text-blue-600 bg-blue-50" },
              { icon: Receipt,    label: "New Bill",      desc: "Record a vendor expense",   path: "/bills",     color: "text-purple-600 bg-purple-50" },
              { icon: UserPlus,   label: "Add Customer",  desc: "Create a customer profile", path: "/customers", color: "text-emerald-600 bg-emerald-50" },
              { icon: Store,      label: "Add Vendor",    desc: "Create a vendor profile",   path: "/vendors",   color: "text-amber-600 bg-amber-50" },
            ].map(({ icon: Icon, label, desc, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Invoices ───────────────────────────────────────────────────── */}
      {stats.recentInvoices.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-display font-semibold text-base text-foreground">Recent Invoices</h3>
            <button onClick={() => navigate("/invoices")}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentInvoices.map((inv, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate("/invoices")}>
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">{inv.number}</td>
                  <td className="px-5 py-3.5 text-foreground">{inv.customer}</td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge className={`text-xs ${invoiceStatusStyle[inv.status] || "bg-slate-100 text-slate-600"}`}>
                      {statusLabel[inv.status] || inv.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">{fmt(inv.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}
