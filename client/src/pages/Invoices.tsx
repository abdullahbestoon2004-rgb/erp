import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { Invoice } from "@/types";
import { invoiceStorage, customerStorage, adjustStock } from "@/lib/storage";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceDetail from "@/components/InvoiceDetail";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setInvoices(invoiceStorage.getAll());
  };

  const handleSave = (invoiceData: any) => {
    if (editingId) {
      // Restore stock from old line items, then deduct new ones
      const old = invoiceStorage.getAll().find(i => i.id === editingId);
      if (old) adjustStock(old.lineItems, 1);
      invoiceStorage.update(editingId, invoiceData);
      setEditingId(null);
    } else {
      invoiceStorage.add(invoiceData);
    }
    adjustStock(invoiceData.lineItems, -1);
    loadInvoices();
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      const inv = invoiceStorage.getAll().find(i => i.id === id);
      if (inv) adjustStock(inv.lineItems, 1);
      invoiceStorage.delete(id);
      loadInvoices();
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditingId(invoice.id);
    setIsFormOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "sent":
      case "viewed":
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
          <h1 className="font-display font-bold text-3xl text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your customer invoices</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setSelectedInvoice(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent fullScreen className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background flex items-center justify-between">
              <DialogTitle className="text-xl font-display font-bold">
                {editingId ? "Edit Invoice" : "Create New Invoice"}
              </DialogTitle>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
              <div className="max-w-5xl mx-auto p-8">
                <div className="bg-card rounded-xl border border-border shadow-sm p-8">
                  <InvoiceForm
                    invoice={selectedInvoice || undefined}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                  />
                </div>
              </div>
            </div>

            {/* Sticky footer with action buttons */}
            <div className="shrink-0 border-t border-border bg-background px-8 py-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="invoice-form"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
              >
                {editingId ? "Update Invoice" : "Save Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by invoice number or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Invoices List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 pr-4">
          {filteredInvoices.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No invoices found</p>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {invoice.invoiceNumber}
                      </h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.customerName} • {new Date(invoice.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ${(invoice.total).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(invoice)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(invoice.id)}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
