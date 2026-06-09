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
import { Plus, Edit2, Trash2, Play, Pause, RefreshCw } from "lucide-react";
import { RecurringInvoice, LineItem } from "@/types";
import { recurringInvoiceStorage, customerStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function RecurringInvoices() {
  const [profiles, setProfiles] = useState<RecurringInvoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [nextInvoiceDate, setNextInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [status, setStatus] = useState<"active" | "paused">("active");

  useEffect(() => {
    loadProfiles();
    setCustomers(customerStorage.getAll());
  }, []);

  const loadProfiles = () => {
    setProfiles(recurringInvoiceStorage.getAll());
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
    setFrequency("monthly");
    setNextInvoiceDate(new Date().toISOString().split("T")[0]);
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setStatus("active");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) {
      toast.error("Please select a customer and add line items");
      return;
    }

    const profileData = {
      customerId,
      customerName,
      frequency,
      nextInvoiceDate: new Date(nextInvoiceDate).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      status,
    };

    if (editingId) {
      recurringInvoiceStorage.update(editingId, profileData);
      toast.success("Recurring profile updated");
    } else {
      recurringInvoiceStorage.add(profileData);
      toast.success("Recurring profile created");
    }

    loadProfiles();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (profile: any) => {
    setEditingId(profile.id);
    setCustomerId(profile.customerId);
    setCustomerName(profile.customerName);
    setFrequency(profile.frequency);
    setNextInvoiceDate(new Date(profile.nextInvoiceDate).toISOString().split("T")[0]);
    setLineItems(profile.lineItems);
    setStatus(profile.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this recurring profile?")) {
      recurringInvoiceStorage.delete(id);
      toast.success("Profile deleted");
      loadProfiles();
    }
  };

  const toggleStatus = (profile: RecurringInvoice) => {
    const nextStatus = profile.status === "active" ? "paused" : "active";
    recurringInvoiceStorage.update(profile.id, { status: nextStatus });
    toast.success(`Profile ${nextStatus === "active" ? "activated" : "paused"}`);
    loadProfiles();
  };

  const filtered = profiles.filter((p) =>
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Recurring Invoices</h1>
          <p className="text-muted-foreground mt-1">Automate invoice creation on a recurring schedule</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Recurring Profile" : "Create Recurring Profile"}</DialogTitle>
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
                  <Label>Frequency *</Label>
                  <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Next Invoice Date</Label>
                  <Input type="date" value={nextInvoiceDate} onChange={(e) => setNextInvoiceDate(e.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
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
                        className="col-span-2 text-xs"
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

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update Profile" : "Create Profile"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No recurring profiles found</p>
            </Card>
          ) : (
            filtered.map((profile) => (
              <Card key={profile.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {profile.customerName}
                      </h3>
                      <Badge className={profile.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        {profile.frequency.charAt(0).toUpperCase() + profile.frequency.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Next invoice date: {new Date(profile.nextInvoiceDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${profile.total.toFixed(2)} / billing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleStatus(profile)}
                    >
                      {profile.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(profile)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(profile.id)}>
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
