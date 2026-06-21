import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Invoice, LineItem } from "@/types";
import { customerStorage, invoiceStorage } from "@/lib/storage";
import LineItemsTable from "@/components/LineItemsTable";
import { Badge } from "@/components/ui/badge";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState(invoice?.customerId || "");
  const [customerName, setCustomerName] = useState(invoice?.customerName || "");
  const [date, setDate] = useState(
    invoice ? new Date(invoice.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    invoice ? new Date(invoice.dueDate).toISOString().split("T")[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems || [
      { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
    ]
  );
  const [notes, setNotes] = useState(invoice?.notes || "");

  useEffect(() => {
    setCustomers(customerStorage.getAll());
  }, []);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setCustomerName(customer.name);
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = lineItems.reduce((sum, item) => sum + (item.amount * item.taxRate) / 100, 0);
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || lineItems.length === 0) {
      alert("Please select a customer and add line items");
      return;
    }

    const invoiceData = {
      // Drafts receive a provisional DRAFT-{ts} number.
      // The real sequential INV-XXXXX is assigned atomically at send time,
      // so deleting a draft never leaves a gap in posted invoice numbers.
      invoiceNumber: invoice?.invoiceNumber || `DRAFT-${Date.now()}`,
      customerId,
      customerName,
      date: new Date(date).getTime(),
      dueDate: new Date(dueDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      balance_due: invoice?.balance_due ?? total,
      posted: invoice?.posted ?? false,
      sent_at: invoice?.sent_at ?? null,
      notes,
      status: (invoice?.status ?? "draft") as Invoice["status"],
    };

    onSave(invoiceData);
  };

  return (
    <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Customer + Invoice number row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer">Customer *</Label>
          <Select value={customerId} onValueChange={handleCustomerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Invoice #</Label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground">
            <span>{invoice?.invoiceNumber || "Auto-assigned on send"}</span>
            <Badge className="ml-auto bg-slate-100 text-slate-600 text-xs font-medium">Draft</Badge>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Invoice Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <Label className="mb-3 block">Line Items *</Label>
        <LineItemsTable value={lineItems} onChange={setLineItems} />
      </div>

      {/* Totals */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes for the customer..."
          className="w-full p-2 border border-border rounded-md text-sm"
          rows={3}
        />
      </div>

    </form>
  );
}
