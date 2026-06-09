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
import { Plus, Trash2, CreditCard } from "lucide-react";
import { PaymentMade, Bill } from "@/types";
import { paymentMadeStorage, vendorStorage, billStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function PaymentsMade() {
  const [payments, setPayments] = useState<PaymentMade[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [billId, setBillId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank Transfer" | "Credit Card" | "Check">("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    loadPayments();
    setVendors(vendorStorage.getAll());
    setBills(billStorage.getAll());
  }, []);

  const loadPayments = () => {
    setPayments(paymentMadeStorage.getAll());
  };

  const handleVendorChange = (id: string) => {
    setVendorId(id);
    const vendor = vendors.find((v) => v.id === id);
    if (vendor) {
      setVendorName(vendor.name);
    }
    // Filter unpaid bills for this vendor
    setBillId("");
    setAmount("");
  };

  const handleBillChange = (id: string) => {
    setBillId(id);
    const bill = bills.find((b) => b.id === id);
    if (bill) {
      setAmount(bill.total.toString());
    }
  };

  const resetForm = () => {
    setVendorId("");
    setVendorName("");
    setBillId("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Bank Transfer");
    setReferenceNumber("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !amount) {
      toast.error("Please select a vendor and fill in the amount");
      return;
    }

    const matchedBill = bills.find((b) => b.id === billId);

    const paymentData = {
      paymentNumber: paymentMadeStorage.getNextNumber(),
      vendorId,
      vendorName,
      billId: billId || undefined,
      billNumber: matchedBill ? matchedBill.billNumber : undefined,
      amount: parseFloat(amount) || 0,
      date: new Date(date).getTime(),
      paymentMode,
      referenceNumber: referenceNumber || undefined,
    };

    paymentMadeStorage.add(paymentData);

    // Update bill status if a bill was matched
    if (matchedBill) {
      billStorage.update(matchedBill.id, { status: "paid" });
    }

    toast.success("Payment recorded successfully");
    loadPayments();
    setBills(billStorage.getAll()); // refresh bills list
    resetForm();
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      paymentMadeStorage.delete(id);
      toast.success("Payment record deleted successfully");
      loadPayments();
    }
  };

  // Unpaid bills for the selected vendor
  const unpaidBills = bills.filter(
    (b) => b.vendorId === vendorId && b.status !== "paid"
  );

  const filteredPayments = payments.filter(
    (p) =>
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Payments Made</h1>
          <p className="text-muted-foreground mt-1">Record payments sent to vendors for purchases & bills</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment Made
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment Out</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Vendor *</Label>
                <Select value={vendorId} onValueChange={handleVendorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {vendorId && (
                <div>
                  <Label>Apply to Bill (Optional)</Label>
                  <Select value={billId} onValueChange={handleBillChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={unpaidBills.length === 0 ? "No unpaid bills" : "Select a bill"} />
                    </SelectTrigger>
                    <SelectContent>
                      {unpaidBills.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.billNumber} (${b.total.toFixed(2)} - Due: {new Date(b.dueDate).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount Paid ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference # / Txn ID</Label>
                  <Input
                    placeholder="E.g., CHK10023"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search payments made..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No payment records found</p>
            </Card>
          ) : (
            filteredPayments.map((p) => (
              <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-semibold text-foreground">
                        {p.paymentNumber}
                      </h3>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">
                        {p.paymentMode}
                      </Badge>
                      {p.referenceNumber && (
                        <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                          Ref: {p.referenceNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Paid to <span className="font-medium text-foreground">{p.vendorName}</span>
                      {p.billNumber && ` • Applied to Bill: ${p.billNumber}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Payment Date: {new Date(p.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-red-600">
                      -${p.amount.toFixed(2)}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
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
