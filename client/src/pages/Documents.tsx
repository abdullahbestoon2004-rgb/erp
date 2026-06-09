import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Upload, Sparkles, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface DocItem {
  id: string;
  name: string;
  date: number;
  size: string;
  source: "Upload" | "Email Intake";
  status: "Processing" | "Completed";
  ocrData?: {
    vendor: string;
    amount: number;
    dateText: string;
  };
}

export default function Documents() {
  const [docs, setDocs] = useState<DocItem[]>([
    { id: "doc-1", name: "AWS_Invoice_May.pdf", date: Date.now() - 3 * 24 * 60 * 60 * 1000, size: "142 KB", source: "Email Intake", status: "Completed", ocrData: { vendor: "Amazon Web Services", amount: 480.00, dateText: "2026-05-28" } },
    { id: "doc-2", name: "Google_Workspace_Receipt.pdf", date: Date.now() - 5 * 24 * 60 * 60 * 1000, size: "94 KB", source: "Upload", status: "Completed", ocrData: { vendor: "Google LLC", amount: 60.00, dateText: "2026-05-25" } },
    { id: "doc-3", name: "OfficeDepot_Paper_Staples.pdf", date: Date.now() - 10 * 24 * 60 * 60 * 1000, size: "1.2 MB", source: "Upload", status: "Completed", ocrData: { vendor: "Office Depot", amount: 45.80, dateText: "2026-05-20" } }
  ]);

  const [uploading, setUploading] = useState(false);

  const simulateOcrUpload = () => {
    setUploading(true);
    toast.info("Uploading document to Zoho Auto-Scan inbox...");

    setTimeout(() => {
      const newDoc: DocItem = {
        id: `doc-${Date.now()}`,
        name: `Acme_Receipt_${Math.floor(100 + Math.random() * 900)}.pdf`,
        date: Date.now(),
        size: "185 KB",
        source: "Upload",
        status: "Processing"
      };

      setDocs((prev) => [newDoc, ...prev]);
      setUploading(false);
      toast.success("Document uploaded. AI Auto-Scan OCR processing started!");

      // Simulate OCR resolving after 4 seconds
      setTimeout(() => {
        setDocs((prevDocs) =>
          prevDocs.map((d) =>
            d.id === newDoc.id
              ? {
                  ...d,
                  status: "Completed",
                  ocrData: {
                    vendor: "Acme Corp",
                    amount: 1250.00,
                    dateText: new Date().toISOString().split("T")[0]
                  }
                }
              : d
          )
        );
        toast.success(`OCR scan finished for ${newDoc.name}: Detected Acme Corp ($1,250.00)`);
      }, 4000);

    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Documents Box</h1>
          <p className="text-muted-foreground mt-1">AI Auto-Scan inbox for processing paper receipts, bills & bank statements</p>
        </div>
        <Button onClick={simulateOcrUpload} disabled={uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <Card className="p-6 col-span-2 space-y-4">
          <h2 className="font-bold text-lg text-foreground">Inbound Documents</h2>
          
          <ScrollArea className="h-[450px]">
            <div className="space-y-3 pr-2">
              {docs.map((doc) => (
                <div key={doc.id} className="p-4 border rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.date).toLocaleString()} • Size: {doc.size} • Source: {doc.source}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {doc.status === "Processing" ? (
                      <Badge className="bg-amber-100 text-amber-800 animate-pulse">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Scanning...
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OCR Ready
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* OCR Panel */}
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg text-foreground">OCR Extracted Data</h2>
          <p className="text-xs text-muted-foreground">Select a scanned document to view automatic expense data mapping details.</p>
          
          <div className="border-t pt-4 space-y-4">
            {docs.map((d) => (
              d.status === "Completed" && d.ocrData ? (
                <div key={d.id} className="bg-slate-50 p-3.5 rounded border space-y-2 text-xs">
                  <div className="font-bold text-slate-700 border-b pb-1 truncate">{d.name}</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extracted Vendor:</span>
                    <span className="font-semibold text-slate-800">{d.ocrData.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Scan Amount:</span>
                    <span className="font-bold text-slate-800">${d.ocrData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Date:</span>
                    <span className="font-semibold text-slate-800">{d.ocrData.dateText}</span>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => toast.success("Document successfully mapped to Expenses ledger!")}>
                      Map to Expenses
                    </Button>
                  </div>
                </div>
              ) : null
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
