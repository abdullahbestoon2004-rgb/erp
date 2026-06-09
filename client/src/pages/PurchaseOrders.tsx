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
import { Plus, Edit2, Trash2, FileText } from "lucide-react";
import { PurchaseOrder, LineItem, Bill } from "@/types";
import { purchaseOrderStorage, vendorStorage, billStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "issued" | "billed" | "closed">("draft");

  useEffect(() => {
    loadOrders();
    setVendors(vendorStorage.getAll());
  }, []);

  const loadOrders = () => {
    // Because purchaseOrderStorage has getAll, let's load them.
    setOrders(purchaseOrderStorage.getAll());
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
    setVendorId("");
    setVendorName("");
    setDate(new Date().toISOString().split("T")[0]);
    setDeliveryDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setNotes("");
    setStatus("draft");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || lineItems.length === 0) {
      toast.error("Please select a vendor and add line items");
      return;
    }

    const currentOrder = editingId ? orders.find((o) => o.id === editingId) : null;
    const orderData = {
      poNumber: currentOrder?.poNumber || purchaseOrderStorage.getNextNumber(),
      vendorId,
      vendorName,
      date: new Date(date).getTime(),
      deliveryDate: new Date(deliveryDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      notes,
      status,
    };

    if (editingId) {
      purchaseOrderStorage.delete(editingId);
      purchaseOrderStorage.add({
        ...orderData,
        id: editingId,
        createdAt: currentOrder?.createdAt || Date.now(),
      } as any);
      toast.success("Purchase order updated successfully");
    } else {
      purchaseOrderStorage.add(orderData);
      toast.success("Purchase order created successfully");
    }

    loadOrders();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (order: any) => {
    setEditingId(order.id);
    setVendorId(order.vendorId);
    setVendorName(order.vendorName);
    setDate(new Date(order.date).toISOString().split("T")[0]);
    setDeliveryDate(new Date(order.deliveryDate || Date.now()).toISOString().split("T")[0]);
    setLineItems(order.lineItems);
    setNotes(order.notes || "");
    setStatus(order.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      purchaseOrderStorage.delete(id);
      toast.success("Purchase order deleted successfully");
      loadOrders();
    }
  };

  const convertToBill = (order: any) => {
    if (order.status === "billed") {
      toast.info("This purchase order has already been converted to a bill.");
      return;
    }

    const billData = {
      billNumber: billStorage.getNextNumber(),
      vendorId: order.vendorId,
      vendorName: order.vendorName,
      date: Date.now(),
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      lineItems: order.lineItems,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      notes: order.notes ? `${order.notes}\nConverted from PO ${order.poNumber}` : `Converted from PO ${order.poNumber}`,
      status: "received" as const,
    };

    billStorage.add(billData);
    
    // Update PO status to billed
    purchaseOrderStorage.delete(order.id);
    purchaseOrderStorage.add({
      ...order,
      status: "billed"
    });

    toast.success(`Purchase order successfully converted to bill ${billData.billNumber}`);
    loadOrders();
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case "billed":
        return "bg-blue-100 text-blue-800";
      case "issued":
        return "bg-indigo-100 text-indigo-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Send purchase orders to vendors to authorize purchase of goods/services</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Purchase Order" : "Create New Purchase Order"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="issued">Issued</SelectItem>
                      <SelectItem value="billed">Billed</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PO Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Line Items *</Label>
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <Input
                        placeholder="Item Name"
                        value={item.itemName}
                        onChange={(e) => handleLineItemChange(index, "itemName", e.target.value)}
                        className="col-span-3 text-xs"
                      />
                      <Input
                        placeholder="Description"
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
                    <span>Total Purchase Value:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Vendor Notes / Delivery Instructions</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Please deliver during office hours..."
                  className="w-full p-2 border border-border rounded-md text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update PO" : "Create PO"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by PO number or vendor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No purchase orders found</p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {order.poNumber}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.vendorName} • {new Date(order.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      Total: ${order.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {order.status !== "billed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => convertToBill(order)}
                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Convert to Bill
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(order)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(order.id)}>
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
