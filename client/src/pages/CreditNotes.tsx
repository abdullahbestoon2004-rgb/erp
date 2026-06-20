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
import { Plus, Edit2, Trash2, ShieldAlert, Award } from "lucide-react";
import { CreditNote, LineItem } from "@/types";
import { creditNoteStorage, customerStorage } from "@/lib/storage";
import LineItemsTable from "@/components/LineItemsTable";
import { toast } from "sonner";

export default function CreditNotes() {
  const [notes, setNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 },
  ]);
  const [status, setStatus] = useState<"open" | "closed">("open");

  useEffect(() => {
    loadNotes();
    setCustomers(customerStorage.getAll());
  }, []);

  const loadNotes = () => {
    setNotes(creditNoteStorage.getAll());
  };

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

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setLineItems([{ id: "1", itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]);
    setStatus("open");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) {
      toast.error("Please select a customer and add line items");
      return;
    }

    const currentNote = editingId ? notes.find((n) => n.id === editingId) : null;
    const noteData = {
      creditNoteNumber: currentNote?.creditNoteNumber || creditNoteStorage.getNextNumber(),
      customerId,
      customerName,
      date: new Date(date).getTime(),
      lineItems,
      subtotal,
      taxAmount,
      total,
      status,
    };

    if (editingId) {
      creditNoteStorage.delete(editingId);
      creditNoteStorage.add({
        ...noteData,
        id: editingId,
        createdAt: currentNote?.createdAt || Date.now(),
      } as any);
      toast.success("Credit note updated successfully");
    } else {
      creditNoteStorage.add(noteData);
      toast.success("Credit note created successfully");
    }

    loadNotes();
    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setCustomerId(note.customerId);
    setCustomerName(note.customerName);
    setDate(new Date(note.date).toISOString().split("T")[0]);
    setLineItems(note.lineItems);
    setStatus(note.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this credit note?")) {
      creditNoteStorage.delete(id);
      toast.success("Credit note deleted successfully");
      loadNotes();
    }
  };

  const markClosed = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      creditNoteStorage.delete(id);
      creditNoteStorage.add({
        ...note,
        status: "closed"
      });
      toast.success("Credit note marked as closed/refunded");
      loadNotes();
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Credit Notes</h1>
          <p className="text-muted-foreground mt-1">Issue credits to customers for sales returns or adjustments</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Credit Note
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen>
            <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <DialogTitle className="text-xl font-display font-bold">{editingId ? "Edit Credit Note" : "Create New Credit Note"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/20">
              <div className="max-w-5xl mx-auto bg-card p-8 rounded-xl border border-border shadow-sm">
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
                      <SelectItem value="open">Open (Available for credit)</SelectItem>
                      <SelectItem value="closed">Closed (Refunded/Applied)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Credit Note Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Line Items *</Label>
                <LineItemsTable value={lineItems} onChange={setLineItems} />
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
                <Button type="submit">{editingId ? "Update Note" : "Create Note"}</Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search credit notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-4">
          {filteredNotes.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No credit notes found</p>
            </Card>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {note.creditNoteNumber}
                      </h3>
                      <Badge className={note.status === "open" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}>
                        {note.status === "open" ? "Open (Active)" : "Closed (Applied/Refunded)"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {note.customerName} • {new Date(note.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${note.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {note.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markClosed(note.id)}
                        className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        Refund / Apply Credit
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(note)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(note.id)}>
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
