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
import { Plus, Edit2, Trash2, Eye, FileText, CheckCircle } from "lucide-react";
import { Quote, LineItem } from "@/types";
import { quoteStorage, customerStorage, invoiceStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "sent" | "accepted" | "declined" | "invoiced">("draft");

  useEffect(() => {
    loadQuotes();
    setCustomers(customerStorage.getAll());
  }, []);

  const loadQuotes = () => {
    setQuotes(quoteStorage.getAll());
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
    setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setNotes("");
    setStatus("draft");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) {
      toast.error("Please select a customer and add line items");
      return;
    }

    const currentQuote = editingId ? quotes.find((q) => q.id === editingId) : null;
    const quoteData = {
      quoteNumber: currentQuote?.quoteNumber || quoteStorage.getNextNumber(),
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

    if (editingId) {
      quoteStorage.update(editingId, quoteData);
      toast.success("Quote updated successfully");
    } else {
      quoteStorage.add(quoteData);
      toast.success("Quote created successfully");
    }

    loadQuotes();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (quote: any) => {
    setEditingId(quote.id);
    setCustomerId(quote.customerId);
    setCustomerName(quote.customerName);
    setDate(new Date(quote.date).toISOString().split("T")[0]);
    setDueDate(new Date(quote.dueDate).toISOString().split("T")[0]);
    setLineItems(quote.lineItems);
    setNotes(quote.notes || "");
    setStatus(quote.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      quoteStorage.delete(id);
      toast.success("Quote deleted successfully");
      loadQuotes();
    }
  };

  const convertToInvoice = (quote: any) => {
    if (quote.status === "invoiced") {
      toast.info("This quote has already been converted to an invoice.");
      return;
    }

    const invData = {
      invoiceNumber: invoiceStorage.getNextNumber(),
      customerId: quote.customerId,
      customerName: quote.customerName,
      date: Date.now(),
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: quote.notes ? `${quote.notes}\nConverted from ${quote.quoteNumber}` : `Converted from ${quote.quoteNumber}`,
      status: "sent" as const,
    };

    invoiceStorage.add(invData);
    quoteStorage.update(quote.id, { status: "invoiced" });
    toast.success(`Quote successfully converted to invoice ${invData.invoiceNumber}`);
    loadQuotes();
  };

  const filteredQuotes = quotes.filter(
    (q: any) =>
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "invoiced":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-indigo-100 text-indigo-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Quotes</h1>
          <p className="text-muted-foreground mt-1">Send professional quotes to your customers</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Quote" : "Create New Quote"}</DialogTitle>
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
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quote Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Expiry Date</Label>
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

              <div>
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, bank info, notes..."
                  className="w-full p-2 border border-border rounded-md text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update Quote" : "Create Quote"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by quote number or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredQuotes.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No quotes found</p>
            </Card>
          ) : (
            filteredQuotes.map((quote: any) => (
              <Card key={quote.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {quote.quoteNumber}
                      </h3>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quote.customerName} • {new Date(quote.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${quote.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {quote.status !== "invoiced" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => convertToInvoice(quote)}
                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Convert to Invoice
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(quote)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(quote.id)}>
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
