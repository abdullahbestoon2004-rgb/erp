import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Package, Plus, Trash2, Tag, Edit3, ShieldAlert } from "lucide-react";
import { InventoryItem, PriceList, InventoryAdjustment } from "@/types";
import { inventoryItemStorage, priceListStorage, inventoryAdjustmentStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Inventory() {
  const [location, navigate] = useLocation();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);

  // Item Form states
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [salesPrice, setSalesPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [stockOnHand, setStockOnHand] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  // Price List Form states
  const [isPlOpen, setIsPlOpen] = useState(false);
  const [plName, setPlName] = useState("");
  const [plType, setPlType] = useState<"markup" | "discount">("markup");
  const [plPercent, setPlPercent] = useState("");
  const [plDesc, setPlDesc] = useState("");

  // Adjustment Form states
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [adjItemId, setAdjItemId] = useState("");
  const [adjType, setAdjType] = useState<"Quantity" | "Value">("Quantity");
  const [adjValue, setAdjValue] = useState("");
  const [adjReason, setAdjReason] = useState<"Damage" | "Theft" | "Reconciliation" | "Stock Write-off">("Reconciliation");
  const [adjNotes, setAdjNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setItems(inventoryItemStorage.getAll());
    setPriceLists(priceListStorage.getAll());
    setAdjustments(inventoryAdjustmentStorage.getAll());
  };

  // 1. Create Inventory Item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !sku || !salesPrice || !purchasePrice) {
      toast.error("Required fields must be filled");
      return;
    }

    inventoryItemStorage.add({
      name: itemName,
      sku,
      unit,
      salesPrice: parseFloat(salesPrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      stockOnHand: parseInt(stockOnHand) || 0,
      description: itemDesc || undefined
    });

    toast.success(`Inventory Item ${itemName} created!`);
    loadData();
    setIsItemOpen(false);
    // reset form
    setItemName("");
    setSku("");
    setUnit("pieces");
    setSalesPrice("");
    setPurchasePrice("");
    setStockOnHand("");
    setItemDesc("");
  };

  // 2. Create Price List
  const handleCreatePriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plName || !plPercent) {
      toast.error("Required fields must be filled");
      return;
    }

    priceListStorage.add({
      name: plName,
      type: plType,
      percentageChange: parseFloat(plPercent) || 0,
      description: plDesc || undefined
    });

    toast.success(`Price list "${plName}" configured!`);
    loadData();
    setIsPlOpen(false);
    setPlName("");
    setPlPercent("");
    setPlDesc("");
  };

  // 3. Create Adjustment & Update Stock
  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItemId || !adjValue) {
      toast.error("Please select an item and enter adjustment quantity");
      return;
    }

    const matchedItem = items.find(i => i.id === adjItemId);
    if (!matchedItem) return;

    const adjustmentAmount = parseFloat(adjValue) || 0;

    // Save adjustment record
    const nextNumber = inventoryAdjustmentStorage.getNextNumber();
    inventoryAdjustmentStorage.add({
      adjustmentNumber: nextNumber,
      itemId: adjItemId,
      itemName: matchedItem.name,
      date: Date.now(),
      type: adjType,
      adjustedValue: adjustmentAmount,
      reason: adjReason,
      notes: adjNotes || undefined
    });

    // Update item stock on hand
    if (adjType === "Quantity") {
      const newStock = Math.max(0, matchedItem.stockOnHand + adjustmentAmount);
      inventoryItemStorage.update(adjItemId, { stockOnHand: newStock });
      toast.success(`Stock adjusted for ${matchedItem.name}. New Stock: ${newStock}`);
    } else {
      toast.success(`Valuation adjustment recorded for ${matchedItem.name}`);
    }

    loadData();
    setIsAdjOpen(false);
    setAdjItemId("");
    setAdjValue("");
    setAdjNotes("");
  };

  // Calculate prices based on active Price List
  const getAdjustedPrice = (standardPrice: number, pl: PriceList) => {
    const factor = pl.percentageChange / 100;
    if (pl.type === "markup") {
      return standardPrice * (1 + factor);
    } else {
      return standardPrice * (1 - factor);
    }
  };

  // Tab routing mapping
  const getActiveTab = () => {
    if (location === "/items/price-lists") return "price-lists";
    if (location === "/items/adjustments") return "adjustments";
    return "items";
  };

  const activeTab = getActiveTab();

  const renderTabs = () => {
    const tabs = [
      { id: "items", label: "All Items", path: "/items", icon: Package },
      { id: "price-lists", label: "Price Lists", path: "/items/price-lists", icon: Tag },
      { id: "adjustments", label: "Inventory Adjustments", path: "/items/adjustments", icon: Edit3 },
    ];

    return (
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Track catalog items, adjust pricing structures, and record inventory adjustments</p>
      </div>

      {renderTabs()}

      {/* ITEMS LIST TAB */}
      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Stock Catalog</h2>
            <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Catalog Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Item SKU *</Label>
                      <Input placeholder="E.g., SKU-100" value={sku} onChange={(e) => setSku(e.target.value)} />
                    </div>
                    <div>
                      <Label>Measurement Unit</Label>
                      <Input placeholder="E.g., pieces, hrs" value={unit} onChange={(e) => setUnit(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Item Name *</Label>
                    <Input placeholder="E.g., SaaS Standard Token" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Sales Price *</Label>
                      <Input type="number" placeholder="0.00" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} />
                    </div>
                    <div>
                      <Label>Purchase Price *</Label>
                      <Input type="number" placeholder="0.00" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                    </div>
                    <div>
                      <Label>Stock On Hand</Label>
                      <Input type="number" placeholder="0" value={stockOnHand} onChange={(e) => setStockOnHand(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input placeholder="Item description" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsItemOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Item</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.sku} • Unit: {item.unit}</p>
                  </div>
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <div className="space-y-1 mt-4 text-sm pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sales Price:</span>
                    <span className="font-semibold text-foreground">${item.salesPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price:</span>
                    <span className="font-semibold text-foreground">${item.purchasePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-dashed mt-2">
                    <span className="text-muted-foreground">Stock On Hand:</span>
                    <span className={item.stockOnHand > 10 ? "text-green-600" : "text-amber-600"}>
                      {item.stockOnHand} units
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PRICE LISTS TAB */}
      {activeTab === "price-lists" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Global Pricing Structures</h2>
            <Dialog open={isPlOpen} onOpenChange={setIsPlOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Price List
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configure Custom Price List</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePriceList} className="space-y-4">
                  <div>
                    <Label>Price List Name *</Label>
                    <Input placeholder="E.g., Winter Discount 2026" value={plName} onChange={(e) => setPlName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Adjustment Type</Label>
                      <Select value={plType} onValueChange={(v: any) => setPlType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markup">Markup Percentage</SelectItem>
                          <SelectItem value="discount">Discount Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rate Percentage (%) *</Label>
                      <Input type="number" placeholder="10" value={plPercent} onChange={(e) => setPlPercent(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Notes / Description</Label>
                    <Input placeholder="Optional details..." value={plDesc} onChange={(e) => setPlDesc(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsPlOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Price List</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {priceLists.map((pl) => (
              <Card key={pl.id} className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{pl.name}</h3>
                    <p className="text-xs text-muted-foreground">{pl.type.toUpperCase()} • {pl.percentageChange}% change</p>
                  </div>
                  <Badge variant="outline" className={pl.type === "markup" ? "text-green-600 border-green-200 bg-green-50" : "text-amber-600 border-amber-200 bg-amber-50"}>
                    {pl.type === "markup" ? "Markup" : "Discount"}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Simulation (Adjusted Catalog Prices)</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.name}:</span>
                        <span>
                          <span className="line-through text-slate-400 mr-2">${item.salesPrice.toFixed(2)}</span>
                          <span className="font-bold text-slate-800">${getAdjustedPrice(item.salesPrice, pl).toFixed(2)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* INVENTORY ADJUSTMENTS TAB */}
      {activeTab === "adjustments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Stock Reconciliation Logs</h2>
            <Dialog open={isAdjOpen} onOpenChange={setIsAdjOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Make Adjustment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Inventory Adjustment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAdjustment} className="space-y-4">
                  <div>
                    <Label>Select Catalog Item *</Label>
                    <Select value={adjItemId} onValueChange={setAdjItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} (Current Stock: {i.stockOnHand})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Adjustment Type</Label>
                      <Select value={adjType} onValueChange={(v: any) => setAdjType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Quantity">Quantity Adjustment</SelectItem>
                          <SelectItem value="Value">Valuation Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Adjustment Value *</Label>
                      <Input
                        type="number"
                        placeholder="E.g., -5 or +10"
                        value={adjValue}
                        onChange={(e) => setAdjValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Reason *</Label>
                    <Select value={adjReason} onValueChange={(v: any) => setAdjReason(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Damage">Damage</SelectItem>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Reconciliation">Reconciliation</SelectItem>
                        <SelectItem value="Stock Write-off">Stock Write-off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Adjustment Notes</Label>
                    <textarea
                      value={adjNotes}
                      onChange={(e) => setAdjNotes(e.target.value)}
                      placeholder="Explain the reason for adjustment..."
                      className="w-full p-2 border border-border rounded-md text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAdjOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Post Adjustment</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[450px]">
            <div className="space-y-2">
              {adjustments.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No inventory adjustments recorded.
                </Card>
              ) : (
                adjustments.map((adj) => (
                  <Card key={adj.id} className="p-4 flex justify-between items-center hover:shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-foreground">{adj.itemName}</h3>
                        <Badge className="bg-amber-100 text-amber-800">
                          {adj.reason}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {adj.adjustmentNumber} • {new Date(adj.date).toLocaleDateString()}
                      </p>
                      {adj.notes && <p className="text-xs italic text-muted-foreground mt-1">"{adj.notes}"</p>}
                    </div>

                    <div className="text-right">
                      <span className={`font-bold text-lg ${adj.adjustedValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {adj.adjustedValue >= 0 ? "+" : ""}{adj.adjustedValue} units
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
