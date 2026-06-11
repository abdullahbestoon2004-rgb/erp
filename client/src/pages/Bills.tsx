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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { Bill, LineItem } from "@/types";
import { billStorage, vendorStorage } from "@/lib/storage";

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "received" | "approved" | "paid" | "overdue">(
    "draft"
  );

  useEffect(() => {
    loadBills();
    setVendors(vendorStorage.getAll());
  }, []);

  const loadBills = () => {
    setBills(billStorage.getAll());
  };

  const handleVendorChange = (id: string) => {
    setVendorId(id);
    const vendor = vendors.find((v) => v.id === id);
    if (vendor) {
      setVendorName(vendor.name);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || lineItems.length === 0) {
      alert("Please select a vendor and add line items");
      return;
    }

    const currentBill = editingId ? bills.find((b) => b.id === editingId) : null;
    const billData = {
      billNumber: currentBill?.billNumber || billStorage.getNextNumber(),
      vendorId,
      vendorName,
      date: new Date(date).getTime(),
      dueDate: new Date(dueDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      notes,
      status,
    };

    if (editingId) {
      billStorage.update(editingId, billData);
      setEditingId(null);
    } else {
      billStorage.add(billData);
    }

    loadBills();
    resetForm();
    setIsFormOpen(false);
  };

  const resetForm = () => {
    setVendorId("");
    setVendorName("");
    setDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setLineItems([
      { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
    ]);
    setNotes("");
    setStatus("draft");
  };

  const handleEdit = (bill: Bill) => {
    setEditingId(bill.id);
    setVendorId(bill.vendorId);
    setVendorName(bill.vendorName);
    setDate(new Date(bill.date).toISOString().split("T")[0]);
    setDueDate(new Date(bill.dueDate).toISOString().split("T")[0]);
    setLineItems(bill.lineItems);
    setNotes(bill.notes || "");
    setStatus(bill.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      billStorage.delete(id);
      loadBills();
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "approved":
      case "received":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Bills</h1>
          <p className="text-muted-foreground mt-1">Manage vendor bills and expenses</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Bill
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen>
            <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">{editingId ? "Edit Bill" : "Create New Bill"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/20">
              <div className="max-w-5xl mx-auto bg-card p-8 rounded-xl border border-border shadow-sm">
                <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor *</Label>
                  <Select value={vendorId} onValueChange={handleVendorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bill Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
                        className="col-span-2 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                        className="col-span-1 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                        className="col-span-2 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Tax%"
                        value={item.taxRate}
                        onChange={(e) => handleLineItemChange(index, "taxRate", e.target.value)}
                        className="col-span-1 text-xs"
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
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${taxAmount.toFixed(2)}</span>
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
                  placeholder="Add notes..."
                  className="w-full p-2 border border-border rounded-md text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">{editingId ? "Update Bill" : "Create Bill"}</Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by bill number or vendor..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Bills List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 pr-4">
          {filteredBills.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No bills found</p>
            </Card>
          ) : (
            filteredBills.map((bill) => (
              <Card key={bill.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {bill.billNumber}
                      </h3>
                      <Badge className={getStatusColor(bill.status)}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {bill.vendorName} • {new Date(bill.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${(bill.total).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(bill)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(bill.id)}
                    >
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
