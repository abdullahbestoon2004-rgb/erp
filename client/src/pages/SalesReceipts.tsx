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
import { Plus, Edit2, Trash2, FileText, Check } from "lucide-react";
import { SalesReceipt, LineItem } from "@/types";
import { salesReceiptStorage, customerStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function SalesReceipts() {
  const [receipts, setReceipts] = useState<SalesReceipt[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank Transfer" | "Credit Card">("Cash");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"completed" | "draft">("completed");

  useEffect(() => {
    loadReceipts();
    setCustomers(customerStorage.getAll());
  }, []);

  const loadReceipts = () => {
    setReceipts(salesReceiptStorage.getAll());
  };

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
    item.amount = item.quantity * item.unitPrice;
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = lineItems.reduce((sum, item) => sum + (item.amount * item.taxRate) / 100, 0);
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Cash");
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setNotes("");
    setStatus("completed");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) {
      toast.error("Please select a customer and add line items");
      return;
    }

    const currentReceipt = editingId ? receipts.find((r) => r.id === editingId) : null;
    const receiptData = {
      receiptNumber: currentReceipt?.receiptNumber || salesReceiptStorage.getNextNumber(),
      customerId,
      customerName,
      date: new Date(date).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      paymentMode,
      status,
    };

    if (editingId) {
      // update is not explicitly in storage, but we can do a delete & add or extend storage.
      // salesReceiptStorage only has getAll, add, delete. Let's delete and re-add to update.
      salesReceiptStorage.delete(editingId);
      salesReceiptStorage.add({
        ...receiptData,
        id: editingId,
        createdAt: currentReceipt?.createdAt || Date.now(),
      } as any);
      toast.success("Sales receipt updated successfully");
    } else {
      salesReceiptStorage.add(receiptData);
      toast.success("Sales receipt created successfully");
    }

    loadReceipts();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (receipt: any) => {
    setEditingId(receipt.id);
    setCustomerId(receipt.customerId);
    setCustomerName(receipt.customerName);
    setDate(new Date(receipt.date).toISOString().split("T")[0]);
    setPaymentMode(receipt.paymentMode);
    setLineItems(receipt.lineItems);
    setStatus(receipt.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this sales receipt?")) {
      salesReceiptStorage.delete(id);
      toast.success("Sales receipt deleted successfully");
      loadReceipts();
    }
  };

  const filteredReceipts = receipts.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Sales Receipts</h1>
          <p className="text-muted-foreground mt-1">Record payments received immediately from sales</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Sales Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Sales Receipt" : "Create New Sales Receipt"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Receipt Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Line Items *</Label>
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <Input
                        placeholder="Item"
                        value={item.itemName}
                        onChange={(e) => handleLineItemChange(index, "itemName", e.target.value)}
                        className="col-span-3 text-xs"
                      />
                      <Input
                        placeholder="Desc"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                        className="col-span-3 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                        className="col-span-2 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                        className="col-span-2 text-xs"
                      />
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-xs">${item.amount.toFixed(2)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLineItem(index)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addLineItem} className="mt-2 w-full text-xs">
                  + Add Line
                </Button>
              </div>

              <Card className="p-3 bg-muted/50">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border pt-1">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, notes..."
                  className="w-full p-2 border border-border rounded-md text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update Receipt" : "Create Receipt"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by receipt number or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredReceipts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No sales receipts found</p>
            </Card>
          ) : (
            filteredReceipts.map((receipt) => (
              <Card key={receipt.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {receipt.receiptNumber}
                      </h3>
                      <Badge className={receipt.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                        {receipt.paymentMode}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {receipt.customerName} • {new Date(receipt.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${receipt.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(receipt)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(receipt.id)}>
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
