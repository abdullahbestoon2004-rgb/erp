import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck, DollarSign } from "lucide-react";
import { PaymentReceived, Invoice } from "@/types";
import { paymentReceivedStorage, customerStorage, invoiceStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function PaymentsReceived() {
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank Transfer" | "Credit Card" | "Check">("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    loadPayments();
    setCustomers(customerStorage.getAll());
    setInvoices(invoiceStorage.getAll());
  }, []);

  const loadPayments = () => {
    setPayments(paymentReceivedStorage.getAll());
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setInvoiceId("");
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setCustomerName(customer.name);
    }
  };

  // Filter invoices for selected customer that aren't already paid
  const customerInvoices = invoices.filter(
    (inv) => inv.customerId === customerId && inv.status !== "paid"
  );

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const invoice = invoices.find((inv) => inv.id === id);
    if (invoice) {
      setAmount(invoice.total);
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setInvoiceId("");
    setAmount(0);
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Bank Transfer");
    setReferenceNumber("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || amount <= 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const selectedInv = invoices.find((inv) => inv.id === invoiceId);

    const paymentData = {
      paymentNumber: paymentReceivedStorage.getNextNumber(),
      customerId,
      customerName,
      invoiceId: invoiceId || undefined,
      invoiceNumber: selectedInv?.invoiceNumber || undefined,
      amount,
      date: new Date(date).getTime(),
      paymentMode,
      referenceNumber: referenceNumber || undefined,
    };

    paymentReceivedStorage.add(paymentData);

    // Update the invoice status if matched
    if (invoiceId) {
      invoiceStorage.update(invoiceId, { status: "paid" });
      setInvoices(invoiceStorage.getAll()); // reload local state
    }

    toast.success("Payment recorded successfully");
    loadPayments();
    resetForm();
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      paymentReceivedStorage.delete(id);
      toast.success("Payment record deleted");
      loadPayments();
    }
  };

  const filtered = payments.filter(
    (p) =>
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Payments Received</h1>
          <p className="text-muted-foreground mt-1">Record payments received from your clients</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen>
            <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">Record Payment Received</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/20">
              <div className="max-w-3xl mx-auto bg-card p-8 rounded-xl border border-border shadow-sm">
                <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {customerId && (
                <div>
                  <Label>Match to Invoice (Optional)</Label>
                  <Select value={invoiceId} onValueChange={handleInvoiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unpaid invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerInvoices.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} (${inv.total.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Amount Received ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount || ""}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Reference Number (e.g. Check #, Transaction ID)</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TXN1002345"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-green-50 border-green-100">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-green-700 uppercase font-semibold">Total Payments Received</p>
            <p className="text-2xl font-bold text-green-900">
              ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by payment number or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[480px]">
        <div className="space-y-2 pr-4">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No payments recorded yet</p>
            </Card>
          ) : (
            filtered.map((payment) => (
              <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-foreground">
                        {payment.paymentNumber}
                      </h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {payment.paymentMode}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Received from <span className="font-semibold text-slate-700">{payment.customerName}</span> on {new Date(payment.date).toLocaleDateString()}
                    </p>
                    {payment.invoiceNumber && (
                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        Applied to Invoice: {payment.invoiceNumber}
                      </p>
                    )}
                    {payment.referenceNumber && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ref: {payment.referenceNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display font-bold text-lg text-foreground">
                      ${payment.amount.toFixed(2)}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(payment.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
