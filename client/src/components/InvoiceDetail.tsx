import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";

interface InvoiceDetailProps {
  invoice: Invoice;
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            {invoice.invoiceNumber}
          </h2>
          <p className="text-muted-foreground mt-1">{invoice.customerName}</p>
        </div>
        <Badge className={getStatusColor(invoice.status)}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Badge>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Invoice Date</p>
          <p className="font-semibold">{new Date(invoice.date).toLocaleDateString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
          <p className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</p>
        </Card>
      </div>

      {/* Line Items Table */}
      <div>
        <h3 className="font-display font-bold text-lg text-foreground mb-3">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3">Item</th>
                <th className="text-left py-2 px-3">Description</th>
                <th className="text-right py-2 px-3">Qty</th>
                <th className="text-right py-2 px-3">Unit Price</th>
                <th className="text-right py-2 px-3">Tax</th>
                <th className="text-right py-2 px-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-2 px-3">{item.itemName}</td>
                  <td className="py-2 px-3 text-muted-foreground">{item.description}</td>
                  <td className="text-right py-2 px-3">{item.quantity}</td>
                  <td className="text-right py-2 px-3">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">{item.taxRate}%</td>
                  <td className="text-right py-2 px-3 font-semibold">
                    ${item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${invoice.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card className="p-4">
          <h3 className="font-display font-bold text-sm text-foreground mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </Card>
      )}
    </div>
  );
}
