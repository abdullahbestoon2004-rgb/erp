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
import { Trash2, Plus } from "lucide-react";
import { Invoice, LineItem } from "@/types";
import { customerStorage, invoiceStorage } from "@/lib/storage";

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
  const [status, setStatus] = useState<"draft" | "sent" | "viewed" | "paid" | "overdue">(
    invoice?.status || "draft"
  );

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

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    const item = newItems[index];
    (item as any)[field] = field === "quantity" || field === "unitPrice" || field === "taxRate" ? parseFloat(value) || 0 : value;

    // Calculate amount
    item.amount = item.quantity * item.unitPrice;

    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        itemName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
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
      invoiceNumber: invoice?.invoiceNumber || invoiceStorage.getNextNumber(),
      customerId,
      customerName,
      date: new Date(date).getTime(),
      dueDate: new Date(dueDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      notes,
      status,
    };

    onSave(invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
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
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
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
        <Label className="mb-4 block">Line Items *</Label>
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-12 gap-3">
                <Input
                  placeholder="Item name"
                  value={item.itemName}
                  onChange={(e) => handleLineItemChange(index, "itemName", e.target.value)}
                  className="col-span-3"
                />
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                  className="col-span-3"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                  className="col-span-1"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                  className="col-span-1"
                />
                <Input
                  type="number"
                  placeholder="Tax %"
                  value={item.taxRate}
                  onChange={(e) => handleLineItemChange(index, "taxRate", e.target.value)}
                  className="col-span-1"
                />
                <div className="col-span-2 flex items-center justify-between">
                  <span className="font-semibold">
                    ${item.amount.toFixed(2)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addLineItem} className="mt-3 w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Line Item
        </Button>
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

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{invoice ? "Update Invoice" : "Create Invoice"}</Button>
      </div>
    </form>
  );
}
