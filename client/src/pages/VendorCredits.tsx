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
import { Plus, Edit2, Trash2 } from "lucide-react";
import { VendorCredit, LineItem } from "@/types";
import { vendorCreditStorage, vendorStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function VendorCredits() {
  const [credits, setCredits] = useState<VendorCredit[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [status, setStatus] = useState<"open" | "closed">("open");

  useEffect(() => {
    loadCredits();
    setVendors(vendorStorage.getAll());
  }, []);

  const loadCredits = () => {
    setCredits(vendorCreditStorage.getAll());
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
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setStatus("open");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || lineItems.length === 0) {
      toast.error("Please select a vendor and add line items");
      return;
    }

    const currentCredit = editingId ? credits.find((c) => c.id === editingId) : null;
    const creditData = {
      creditNumber: currentCredit?.creditNumber || vendorCreditStorage.getNextNumber(),
      vendorId,
      vendorName,
      date: new Date(date).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      status,
    };

    if (editingId) {
      vendorCreditStorage.delete(editingId);
      vendorCreditStorage.add({
        ...creditData,
        id: editingId,
        createdAt: currentCredit?.createdAt || Date.now(),
      } as any);
      toast.success("Vendor credit updated successfully");
    } else {
      vendorCreditStorage.add(creditData);
      toast.success("Vendor credit created successfully");
    }

    loadCredits();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (credit: any) => {
    setEditingId(credit.id);
    setVendorId(credit.vendorId);
    setVendorName(credit.vendorName);
    setDate(new Date(credit.date).toISOString().split("T")[0]);
    setLineItems(credit.lineItems);
    setStatus(credit.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this vendor credit?")) {
      vendorCreditStorage.delete(id);
      toast.success("Vendor credit deleted successfully");
      loadCredits();
    }
  };

  const markClosed = (id: string) => {
    const credit = credits.find((c) => c.id === id);
    if (credit) {
      vendorCreditStorage.delete(id);
      vendorCreditStorage.add({
        ...credit,
        status: "closed"
      });
      toast.success("Vendor credit marked as closed/applied");
      loadCredits();
    }
  };

  const filteredCredits = credits.filter(
    (c) =>
      c.creditNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Vendor Credits</h1>
          <p className="text-muted-foreground mt-1">Track credits issued by your vendors for items returned or adjusted</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Vendor Credit
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen>
            <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">{editingId ? "Edit Vendor Credit" : "Create New Vendor Credit"}</DialogTitle>
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
                      <SelectItem value="open">Open (Available to offset bills)</SelectItem>
                      <SelectItem value="closed">Closed (Applied/Refunded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Credit Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
                        placeholder="Reason/Desc"
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
                    <span>Total Credit:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update Credit" : "Create Credit"}</Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search vendor credits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredCredits.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No vendor credits found</p>
            </Card>
          ) : (
            filteredCredits.map((credit) => (
              <Card key={credit.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {credit.creditNumber}
                      </h3>
                      <Badge className={credit.status === "open" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}>
                        {credit.status === "open" ? "Open (Active)" : "Closed (Applied/Refunded)"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {credit.vendorName} • {new Date(credit.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${credit.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {credit.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markClosed(credit.id)}
                        className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        Apply / Close Credit
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(credit)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(credit.id)}>
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
