import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { invoiceStorage, billStorage, customerStorage, vendorStorage } from "@/lib/storage";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface Stats {
  totalInvoices: number;
  totalBills: number;
  totalCustomers: number;
  totalVendors: number;
  invoiceAmount: number;
  billAmount: number;
  paidInvoices: number;
  paidBills: number;
  overdueInvoices: number;
  overdueBills: number;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalBills: 0,
    totalCustomers: 0,
    totalVendors: 0,
    invoiceAmount: 0,
    billAmount: 0,
    paidInvoices: 0,
    paidBills: 0,
    overdueInvoices: 0,
    overdueBills: 0,
  });

  useEffect(() => {
    const invoices = invoiceStorage.getAll();
    const bills = billStorage.getAll();
    const customers = customerStorage.getAll();
    const vendors = vendorStorage.getAll();

    const now = Date.now();
    const overdueInvoices = invoices.filter(
      (i) => i.status !== "paid" && i.dueDate < now
    ).length;
    const overdueBills = bills.filter((b) => b.status !== "paid" && b.dueDate < now)
      .length;

    setStats({
      totalInvoices: invoices.length,
      totalBills: bills.length,
      totalCustomers: customers.length,
      totalVendors: vendors.length,
      invoiceAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      billAmount: bills.reduce((sum, b) => sum + b.total, 0),
      paidInvoices: invoices.filter((i) => i.status === "paid").length,
      paidBills: bills.filter((b) => b.status === "paid").length,
      overdueInvoices,
      overdueBills,
    });
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    color: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{Icon}</div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <Button onClick={() => navigate("/invoices")}>Create Invoice</Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          label="Total Invoices"
          value={`$${(stats.invoiceAmount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`}
          subtext={`${stats.totalInvoices} invoices`}
          color="bg-primary/10"
        />
        <StatCard
          icon={<DollarSign className="h-6 w-6 text-accent" />}
          label="Total Bills"
          value={`$${(stats.billAmount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`}
          subtext={`${stats.totalBills} bills`}
          color="bg-accent/10"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-primary" />}
          label="Customers"
          value={stats.totalCustomers}
          subtext="Active customers"
          color="bg-primary/10"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-accent" />}
          label="Vendors"
          value={stats.totalVendors}
          subtext="Active vendors"
          color="bg-accent/10"
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Invoice Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Paid</span>
              </div>
              <Badge variant="default">{stats.paidInvoices}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Overdue</span>
              </div>
              <Badge variant="destructive">{stats.overdueInvoices}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <Badge variant="secondary">
                {stats.totalInvoices - stats.paidInvoices}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Bill Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Paid</span>
              </div>
              <Badge variant="default">{stats.paidBills}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Overdue</span>
              </div>
              <Badge variant="destructive">{stats.overdueBills}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <Badge variant="secondary">{stats.totalBills - stats.paidBills}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/invoices")}
            className="w-full"
          >
            New Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/bills")}
            className="w-full"
          >
            New Bill
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/customers")}
            className="w-full"
          >
            Add Customer
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/vendors")}
            className="w-full"
          >
            Add Vendor
          </Button>
        </div>
      </Card>
    </div>
  );
}
