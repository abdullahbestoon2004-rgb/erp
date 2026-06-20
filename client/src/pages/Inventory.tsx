import { useState, useEffect, useRef } from "react";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Package, Plus, Trash2, Tag, Edit3, ShieldAlert, HelpCircle, Image as ImageIcon, X as XIcon } from "lucide-react";
import { InventoryItem, PriceList, InventoryAdjustment } from "@/types";
import { inventoryItemStorage, priceListStorage, inventoryAdjustmentStorage, vendorStorage, coaStorage, invoiceStorage, billStorage, quoteStorage, purchaseOrderStorage } from "@/lib/storage";
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
  const [unit, setUnit] = useState("pcs");
  const [salesPrice, setSalesPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [stockOnHand, setStockOnHand] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  // New Zoho Books Form states
  const [type, setType] = useState<"goods" | "service">("goods");
  const [imageUrl, setImageUrl] = useState("");
  const [isSellable, setIsSellable] = useState(true);
  const [salesAccount, setSalesAccount] = useState("Sales");
  const [salesDescription, setSalesDescription] = useState("");
  const [salesTax, setSalesTax] = useState("");
  const [isPurchasable, setIsPurchasable] = useState(true);
  const [purchaseAccount, setPurchaseAccount] = useState("Cost of Goods Sold");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseTax, setPurchaseTax] = useState("");
  const [preferredVendor, setPreferredVendor] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [inventoryAccount, setInventoryAccount] = useState("Inventory Asset");
  const [openingStock, setOpeningStock] = useState("0");

  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Item detail view state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "transactions">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<InventoryItem>>({});
  const [showEditUnitDropdown, setShowEditUnitDropdown] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditDraft(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailTab("overview");
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditDraft({ ...selectedItem });
    setShowEditUnitDropdown(false);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    const updated = inventoryItemStorage.update(selectedItem.id, editDraft);
    if (updated) {
      setSelectedItem(updated);
      loadData();
      setIsEditing(false);
      toast.success("Item updated successfully");
    }
  };

  const handleDeleteItem = (id: string) => {
    inventoryItemStorage.delete(id);
    loadData();
    setIsDetailOpen(false);
    setSelectedItem(null);
    toast.success("Item deleted");
  };

  const getItemTransactions = (itemName: string, itemId: string) => {
    const txns: Array<{ type: string; number: string; date: number; counterparty: string; qty: number; amount: number }> = [];

    invoiceStorage.getAll().forEach(inv => {
      inv.lineItems.filter(li => li.itemName === itemName).forEach(li => {
        txns.push({ type: "Invoice", number: inv.invoiceNumber, date: inv.date, counterparty: inv.customerName, qty: li.quantity, amount: li.amount });
      });
    });

    billStorage.getAll().forEach(bill => {
      bill.lineItems.filter(li => li.itemName === itemName).forEach(li => {
        txns.push({ type: "Bill", number: bill.billNumber, date: bill.date, counterparty: bill.vendorName, qty: li.quantity, amount: li.amount });
      });
    });

    quoteStorage.getAll().forEach(q => {
      q.lineItems.filter(li => li.itemName === itemName).forEach(li => {
        txns.push({ type: "Quote", number: q.quoteNumber, date: q.date, counterparty: q.customerName, qty: li.quantity, amount: li.amount });
      });
    });

    purchaseOrderStorage.getAll().forEach(po => {
      po.lineItems.filter(li => li.itemName === itemName).forEach(li => {
        txns.push({ type: "Purchase Order", number: po.poNumber, date: po.date, counterparty: po.vendorName, qty: li.quantity, amount: li.amount });
      });
    });

    inventoryAdjustmentStorage.getAll().filter(adj => adj.itemId === itemId).forEach(adj => {
      txns.push({ type: "Adjustment", number: adj.adjustmentNumber, date: adj.date, counterparty: adj.reason, qty: adj.adjustedValue, amount: 0 });
    });

    return txns.sort((a, b) => b.date - a.date);
  };

  const STANDARD_UNITS = [
    "pcs", "box", "ctn", "dz", "ea", "hrs", "kg", "g", "mg", "L", "mL", "m", 
    "cm", "mm", "in", "ft", "yd", "sq m", "sq ft", "pk", "roll", "bag", 
    "btl", "can", "case", "pr", "lb", "oz", "ton", "day", "wk", "mo", "yr"
  ];

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
    if (!itemName) {
      toast.error("Item name is required");
      return;
    }
    if (isSellable && !salesPrice) {
      toast.error("Selling price is required for sellable items");
      return;
    }
    if (isPurchasable && !purchasePrice) {
      toast.error("Cost price is required for purchasable items");
      return;
    }

    inventoryItemStorage.add({
      name: itemName,
      sku,
      unit,
      salesPrice: isSellable ? parseFloat(salesPrice) || 0 : 0,
      purchasePrice: isPurchasable ? parseFloat(purchasePrice) || 0 : 0,
      stockOnHand: trackInventory ? parseInt(openingStock) || 0 : 0,
      description: isSellable ? salesDescription : (isPurchasable ? purchaseDescription : undefined),
      
      // new fields
      type,
      imageUrl,
      isSellable,
      salesAccount: isSellable ? salesAccount : undefined,
      salesDescription: isSellable ? salesDescription : undefined,
      salesTax: isSellable ? salesTax : undefined,
      isPurchasable,
      purchaseAccount: isPurchasable ? purchaseAccount : undefined,
      purchaseDescription: isPurchasable ? purchaseDescription : undefined,
      purchaseTax: isPurchasable ? purchaseTax : undefined,
      preferredVendor: isPurchasable ? preferredVendor : undefined,
      trackInventory,
      inventoryAccount: trackInventory ? inventoryAccount : undefined
    });

    toast.success(`Inventory Item ${itemName} created!`);
    loadData();
    setIsItemOpen(false);
    
    // reset form
    setItemName("");
    setSku("");
    setUnit("pcs");
    setSalesPrice("");
    setPurchasePrice("");
    setStockOnHand("");
    setItemDesc("");
    setType("goods");
    setImageUrl("");
    setIsSellable(true);
    setSalesAccount("Sales");
    setSalesDescription("");
    setSalesTax("");
    setIsPurchasable(true);
    setPurchaseAccount("Cost of Goods Sold");
    setPurchaseDescription("");
    setPurchaseTax("");
    setPreferredVendor("");
    setTrackInventory(false);
    setInventoryAccount("Inventory Asset");
    setOpeningStock("0");
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
              <DialogContent fullScreen className="bg-slate-50 dark:bg-slate-900 flex flex-col h-screen overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
                  <DialogTitle className="text-xl font-display font-bold">New Item</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950/20">
                  <div className="max-w-5xl mx-auto bg-card p-6 lg:p-8 rounded-xl border border-border shadow-sm">
                    <form onSubmit={handleCreateItem} className="space-y-6">
                      
                      {/* Top Info Area */}
                      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                        
                        {/* Left Side fields */}
                        <div className="flex-1 w-full space-y-4 max-w-2xl">
                          
                          {/* Type Radio Row */}
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                              <span>Type</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent>Physical goods or digital/manual services</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <input
                                  type="radio"
                                  name="itemType"
                                  checked={type === "goods"}
                                  onChange={() => setType("goods")}
                                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                                />
                                Goods
                              </label>
                              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <input
                                  type="radio"
                                  name="itemType"
                                  checked={type === "service"}
                                  onChange={() => setType("service")}
                                  className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                                />
                                Service
                              </label>
                            </div>
                          </div>

                          {/* Name Row */}
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <div className="text-red-500 text-sm font-medium">
                              Name*
                            </div>
                            <Input
                              placeholder="Item name"
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              className="border-blue-200 dark:border-blue-900 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                              required
                            />
                          </div>

                          {/* SKU Row */}
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                              <span>SKU</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent>Stock Keeping Unit code for inventory tracking</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              placeholder="SKU"
                              value={sku}
                              onChange={(e) => setSku(e.target.value)}
                            />
                          </div>

                          {/* Unit Row */}
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                              <span>Unit</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent>Measurement unit for pricing and counting</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="relative">
                              <Input
                                placeholder="Select or type to add"
                                value={unit}
                                onChange={(e) => {
                                  setUnit(e.target.value);
                                  setUnitSearch(e.target.value);
                                  setShowUnitDropdown(true);
                                }}
                                onFocus={() => setShowUnitDropdown(true)}
                                onBlur={() => {
                                  setTimeout(() => setShowUnitDropdown(false), 200);
                                }}
                              />
                              {showUnitDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  {STANDARD_UNITS.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase())).map(u => (
                                    <button
                                      key={u}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                      onClick={() => {
                                        setUnit(u);
                                        setUnitSearch("");
                                        setShowUnitDropdown(false);
                                      }}
                                    >
                                      {u}
                                    </button>
                                  ))}
                                  {unitSearch && !STANDARD_UNITS.map(s => s.toLowerCase()).includes(unitSearch.toLowerCase()) && (
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-accent font-medium"
                                      onClick={() => {
                                        setUnit(unitSearch);
                                        setUnitSearch("");
                                        setShowUnitDropdown(false);
                                      }}
                                    >
                                      Add "{unitSearch}"
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Right Side upload box */}
                        <div className="w-full lg:w-auto shrink-0 flex justify-center">
                          <div 
                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 w-64 h-48 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors relative cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                            {imageUrl ? (
                              <div className="absolute inset-0 w-full h-full p-2">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageUrl("");
                                  }}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-md transition-colors"
                                >
                                  <XIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-center space-y-2">
                                <ImageIcon className="h-10 w-10 mx-auto text-slate-400 group-hover:text-slate-500 transition-colors" />
                                <p className="text-xs text-slate-500">
                                  Drag image(s) here or <span className="text-blue-600 hover:underline">Browse images</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                      {/* Side-by-side Columns */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        
                        {/* Sales Information */}
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Sales Information</h3>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isSellable} 
                                onChange={(e) => setIsSellable(e.target.checked)} 
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span className="font-medium text-slate-600 dark:text-slate-400">Sellable</span>
                            </label>
                          </div>

                          <div className="space-y-4" style={{ opacity: isSellable ? 1 : 0.5 }}>
                            
                            {/* Price */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="text-red-500 text-sm font-medium border-b border-dashed border-red-300 w-fit">
                                Selling Price*
                              </div>
                              <div className="flex rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <div className="bg-slate-100 dark:bg-slate-800 text-muted-foreground px-3 py-2 border-r border-border text-sm font-medium select-none">
                                  USD
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={salesPrice}
                                  onChange={(e) => setSalesPrice(e.target.value)}
                                  disabled={!isSellable}
                                  required={isSellable}
                                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground disabled:opacity-50 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            {/* Account */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="text-red-500 text-sm font-medium border-b border-dashed border-red-300 w-fit">
                                Account*
                              </div>
                              <select
                                value={salesAccount}
                                onChange={(e) => setSalesAccount(e.target.value)}
                                disabled={!isSellable}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100"
                              >
                                {[
                                  "Sales",
                                  "Other Income",
                                  "Interest Income",
                                  ...coaStorage.getAll().filter(a => a.accountType === "Revenue").map(a => a.accountName)
                                ].filter((v, i, a) => a.indexOf(v) === i).map(acc => (
                                  <option key={acc} value={acc}>{acc}</option>
                                ))}
                              </select>
                            </div>

                            {/* Description */}
                            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                              <div className="text-slate-500 text-sm pt-2">
                                Description
                              </div>
                              <textarea
                                placeholder="Sales description"
                                value={salesDescription}
                                onChange={(e) => setSalesDescription(e.target.value)}
                                disabled={!isSellable}
                                rows={3}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 resize-none"
                              />
                            </div>

                            {/* Tax */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                <span>Tax</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Standard sales tax percentage</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <select
                                value={salesTax}
                                onChange={(e) => setSalesTax(e.target.value)}
                                disabled={!isSellable}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100"
                              >
                                <option value="">Select a Tax</option>
                                <option value="0">Tax-Free (0%)</option>
                                <option value="8.25">Standard Tax (8.25%)</option>
                                <option value="15">VAT (15%)</option>
                              </select>
                            </div>

                          </div>
                        </div>

                        {/* Purchase Information */}
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Purchase Information</h3>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isPurchasable} 
                                onChange={(e) => setIsPurchasable(e.target.checked)} 
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span className="font-medium text-slate-600 dark:text-slate-400">Purchasable</span>
                            </label>
                          </div>

                          <div className="space-y-4" style={{ opacity: isPurchasable ? 1 : 0.5 }}>
                            
                            {/* Price */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="text-red-500 text-sm font-medium border-b border-dashed border-red-300 w-fit">
                                Cost Price*
                              </div>
                              <div className="flex rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <div className="bg-slate-100 dark:bg-slate-800 text-muted-foreground px-3 py-2 border-r border-border text-sm font-medium select-none">
                                  USD
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={purchasePrice}
                                  onChange={(e) => setPurchasePrice(e.target.value)}
                                  disabled={!isPurchasable}
                                  required={isPurchasable}
                                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground disabled:opacity-50 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            {/* Account */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="text-red-500 text-sm font-medium border-b border-dashed border-red-300 w-fit">
                                Account*
                              </div>
                              <select
                                value={purchaseAccount}
                                onChange={(e) => setPurchaseAccount(e.target.value)}
                                disabled={!isPurchasable}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100"
                              >
                                {[
                                  "Cost of Goods Sold",
                                  "Materials",
                                  "Labor",
                                  "Advertising Expense",
                                  "Office Supplies",
                                  ...coaStorage.getAll().filter(a => a.accountType === "Expense").map(a => a.accountName)
                                ].filter((v, i, a) => a.indexOf(v) === i).map(acc => (
                                  <option key={acc} value={acc}>{acc}</option>
                                ))}
                              </select>
                            </div>

                            {/* Description */}
                            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                              <div className="text-slate-500 text-sm pt-2">
                                Description
                              </div>
                              <textarea
                                placeholder="Purchase description"
                                value={purchaseDescription}
                                onChange={(e) => setPurchaseDescription(e.target.value)}
                                disabled={!isPurchasable}
                                rows={3}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 resize-none"
                              />
                            </div>

                            {/* Tax */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                <span>Tax</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Standard purchase tax percentage</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <select
                                value={purchaseTax}
                                onChange={(e) => setPurchaseTax(e.target.value)}
                                disabled={!isPurchasable}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100"
                              >
                                <option value="">Select a Tax</option>
                                <option value="0">Tax-Free (0%)</option>
                                <option value="8.25">Standard Tax (8.25%)</option>
                                <option value="15">VAT (15%)</option>
                              </select>
                            </div>

                            {/* Preferred Vendor */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <div className="text-slate-500 text-sm">
                                Preferred Vendor
                              </div>
                              <select
                                value={preferredVendor}
                                onChange={(e) => setPreferredVendor(e.target.value)}
                                disabled={!isPurchasable}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100"
                              >
                                <option value="">Select a Vendor</option>
                                {vendorStorage.getAll().map(v => (
                                  <option key={v.id} value={v.name}>{v.name}</option>
                                ))}
                              </select>
                            </div>

                          </div>
                        </div>

                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                      {/* Inventory Tracking */}
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="trackInventory"
                            checked={trackInventory}
                            onChange={(e) => setTrackInventory(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <label htmlFor="trackInventory" className="flex items-center gap-1.5 text-sm font-medium cursor-pointer select-none">
                            <span>Track Inventory for this item</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
                                </TooltipTrigger>
                                <TooltipContent>Monitor stock levels automatically</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground pl-7">
                          You cannot enable/disable inventory tracking once you've created transactions for this item
                        </p>

                        {trackInventory && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 pt-2 max-w-3xl animate-in fade-in-50 duration-200">
                            {/* Opening Stock */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <span className="text-sm text-slate-500">Opening Stock</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={openingStock}
                                onChange={(e) => setOpeningStock(e.target.value)}
                              />
                            </div>

                            {/* Inventory Account */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                              <span className="text-sm text-slate-500">Inventory Account</span>
                              <select
                                value={inventoryAccount}
                                onChange={(e) => setInventoryAccount(e.target.value)}
                                className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-900 dark:text-slate-100"
                              >
                                <option value="Inventory Asset">Inventory Asset</option>
                                {coaStorage.getAll()
                                  .filter(a => a.accountType === "Asset")
                                  .map(a => a.accountName)
                                  .filter(name => name !== "Inventory Asset")
                                  .map(name => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                          Save
                        </Button>
                      </div>

                    </form>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="p-5 hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer hover:border-blue-300 dark:hover:border-blue-700" onClick={() => handleOpenDetail(item)}>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <Package className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-base text-foreground line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.sku || "No SKU"} • {item.unit}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={item.type === "service" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800"}>
                      {item.type ? (item.type.charAt(0).toUpperCase() + item.type.slice(1)) : "Goods"}
                    </Badge>
                  </div>
                  {(item.description || item.salesDescription) && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md">
                      {item.description || item.salesDescription}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 mt-auto text-sm pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Sales Price:</span>
                    <span className="font-semibold text-foreground text-xs">
                      {item.isSellable !== false ? `$${item.salesPrice.toFixed(2)}` : <span className="text-muted-foreground italic">Not Sellable</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Purchase Price:</span>
                    <span className="font-semibold text-foreground text-xs">
                      {item.isPurchasable !== false ? `$${item.purchasePrice.toFixed(2)}` : <span className="text-muted-foreground italic">Not Purchasable</span>}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 mt-2">
                    <span className="text-muted-foreground text-xs">Stock On Hand:</span>
                    <span className={`text-xs ${item.trackInventory !== false ? (item.stockOnHand > 10 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400") : "text-slate-500 dark:text-slate-400"}`}>
                      {item.trackInventory !== false ? `${item.stockOnHand} units` : "Not Tracked"}
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

      {/* ITEM DETAIL DIALOG */}
      {selectedItem && (
        <Dialog open={isDetailOpen} onOpenChange={(open) => { setIsDetailOpen(open); if (!open) setIsEditing(false); }}>
          <DialogContent fullScreen className="bg-slate-50 dark:bg-slate-900 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(isEditing ? editDraft.imageUrl : selectedItem.imageUrl) ? (
                    <img src={isEditing ? editDraft.imageUrl : selectedItem.imageUrl} alt={selectedItem.name} className="w-10 h-10 object-cover rounded-md border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl font-display font-bold">{isEditing ? (editDraft.name || selectedItem.name) : selectedItem.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{selectedItem.sku || "No SKU"} • {selectedItem.unit}</span>
                      <Badge variant="outline" className={selectedItem.type === "service" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300"}>
                        {selectedItem.type ? (selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)) : "Goods"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button size="sm" onClick={handleStartEdit}>
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Edit Item
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveEdit}>Save Changes</Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeleteItem(selectedItem.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Tab Bar */}
            <div className="flex border-b border-border bg-background shrink-0 px-6">
              {(["overview", "transactions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                    detailTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="max-w-5xl mx-auto">

                {/* OVERVIEW — VIEW MODE */}
                {detailTab === "overview" && !isEditing && (
                  <div className="space-y-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                      <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="shrink-0">
                          {selectedItem.imageUrl ? (
                            <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-28 h-28 object-cover rounded-xl border border-slate-200" />
                          ) : (
                            <div className="w-28 h-28 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              <Package className="h-10 w-10 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Item Name</p>
                            <p className="font-semibold">{selectedItem.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">SKU</p>
                            <p className="font-semibold">{selectedItem.sku || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Unit</p>
                            <p className="font-semibold">{selectedItem.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                            <p className="font-semibold capitalize">{selectedItem.type || "Goods"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                            <p className="font-semibold">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Sales Information</h3>
                          {selectedItem.isSellable !== false
                            ? <Badge className="bg-green-100 text-green-700 border-green-200">Sellable</Badge>
                            : <Badge variant="outline" className="text-slate-500">Not Sellable</Badge>}
                        </div>
                        {selectedItem.isSellable !== false ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Selling Price</span>
                              <span className="font-bold text-lg text-green-700 dark:text-green-400">${selectedItem.salesPrice.toFixed(2)}</span>
                            </div>
                            {selectedItem.salesAccount && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Account</span>
                                <span className="text-sm font-medium">{selectedItem.salesAccount}</span>
                              </div>
                            )}
                            {selectedItem.salesTax && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Tax</span>
                                <span className="text-sm font-medium">{selectedItem.salesTax}%</span>
                              </div>
                            )}
                            {selectedItem.salesDescription && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground mb-1">Description</p>
                                <p className="text-sm">{selectedItem.salesDescription}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not configured for sales.</p>
                        )}
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Purchase Information</h3>
                          {selectedItem.isPurchasable !== false
                            ? <Badge className="bg-blue-100 text-blue-700 border-blue-200">Purchasable</Badge>
                            : <Badge variant="outline" className="text-slate-500">Not Purchasable</Badge>}
                        </div>
                        {selectedItem.isPurchasable !== false ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Cost Price</span>
                              <span className="font-bold text-lg text-blue-700 dark:text-blue-400">${selectedItem.purchasePrice.toFixed(2)}</span>
                            </div>
                            {selectedItem.purchaseAccount && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Account</span>
                                <span className="text-sm font-medium">{selectedItem.purchaseAccount}</span>
                              </div>
                            )}
                            {selectedItem.purchaseTax && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Tax</span>
                                <span className="text-sm font-medium">{selectedItem.purchaseTax}%</span>
                              </div>
                            )}
                            {selectedItem.preferredVendor && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Preferred Vendor</span>
                                <span className="text-sm font-medium">{selectedItem.preferredVendor}</span>
                              </div>
                            )}
                            {selectedItem.purchaseDescription && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground mb-1">Description</p>
                                <p className="text-sm">{selectedItem.purchaseDescription}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not configured for purchases.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                      <h3 className="font-semibold mb-4">Inventory Tracking</h3>
                      {selectedItem.trackInventory !== false ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Stock On Hand</p>
                            <p className={`font-bold text-2xl ${selectedItem.stockOnHand > 10 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {selectedItem.stockOnHand}
                              <span className="text-sm font-normal ml-1 text-muted-foreground">{selectedItem.unit}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Inventory Account</p>
                            <p className="font-semibold">{selectedItem.inventoryAccount || "Inventory Asset"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <Badge className={selectedItem.stockOnHand > 10 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                              {selectedItem.stockOnHand > 10 ? "In Stock" : "Low Stock"}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Inventory tracking is not enabled for this item.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* OVERVIEW — EDIT MODE */}
                {detailTab === "overview" && isEditing && (
                  <div className="bg-card p-6 lg:p-8 rounded-xl border border-border space-y-6">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                      <div className="flex-1 space-y-4 max-w-2xl">
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                          <span className="text-slate-500 text-sm font-medium">Type</span>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                              <input type="radio" name="editType" checked={editDraft.type === "goods" || !editDraft.type}
                                onChange={() => setEditDraft(p => ({ ...p, type: "goods" }))} className="h-4 w-4" />
                              Goods
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                              <input type="radio" name="editType" checked={editDraft.type === "service"}
                                onChange={() => setEditDraft(p => ({ ...p, type: "service" }))} className="h-4 w-4" />
                              Service
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                          <span className="text-red-500 text-sm font-medium">Name*</span>
                          <Input value={editDraft.name || ""} onChange={(e) => setEditDraft(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                          <span className="text-slate-500 text-sm font-medium">SKU</span>
                          <Input value={editDraft.sku || ""} onChange={(e) => setEditDraft(p => ({ ...p, sku: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                          <span className="text-slate-500 text-sm font-medium">Unit</span>
                          <div className="relative">
                            <Input
                              value={editDraft.unit || ""}
                              onChange={(e) => { setEditDraft(p => ({ ...p, unit: e.target.value })); setShowEditUnitDropdown(true); }}
                              onFocus={() => setShowEditUnitDropdown(true)}
                              onBlur={() => setTimeout(() => setShowEditUnitDropdown(false), 200)}
                            />
                            {showEditUnitDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {STANDARD_UNITS.filter(u => u.toLowerCase().includes((editDraft.unit || "").toLowerCase())).map(u => (
                                  <button key={u} type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => { setEditDraft(p => ({ ...p, unit: u })); setShowEditUnitDropdown(false); }}>
                                    {u}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div
                          className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 w-48 h-36 cursor-pointer hover:bg-slate-100/50 relative"
                          onClick={() => editFileInputRef.current?.click()}
                        >
                          <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={handleEditImageChange} />
                          {editDraft.imageUrl ? (
                            <div className="absolute inset-0 p-2">
                              <img src={editDraft.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); setEditDraft(p => ({ ...p, imageUrl: "" })); }}
                                className="absolute top-3 right-3 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700">
                                <XIcon className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-slate-400 mb-1" />
                              <p className="text-xs text-slate-500">Click to upload</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-5">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Sales Information</h3>
                          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input type="checkbox" checked={editDraft.isSellable !== false}
                              onChange={(e) => setEditDraft(p => ({ ...p, isSellable: e.target.checked }))}
                              className="rounded h-4 w-4" />
                            <span className="text-slate-600 dark:text-slate-400">Sellable</span>
                          </label>
                        </div>
                        <div className="space-y-4" style={{ opacity: editDraft.isSellable !== false ? 1 : 0.5 }}>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-red-500 text-sm font-medium">Selling Price*</span>
                            <div className="flex rounded-md border border-input bg-background overflow-hidden">
                              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm border-r border-border font-medium select-none">USD</div>
                              <input type="number" step="0.01" placeholder="0.00"
                                value={editDraft.salesPrice ?? ""}
                                onChange={(e) => setEditDraft(p => ({ ...p, salesPrice: parseFloat(e.target.value) || 0 }))}
                                disabled={editDraft.isSellable === false}
                                className="flex-1 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground disabled:opacity-50 dark:text-slate-100" />
                            </div>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-slate-500 text-sm">Account</span>
                            <select value={editDraft.salesAccount || "Sales"}
                              onChange={(e) => setEditDraft(p => ({ ...p, salesAccount: e.target.value }))}
                              disabled={editDraft.isSellable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100">
                              {["Sales", "Other Income", "Interest Income", ...coaStorage.getAll().filter(a => a.accountType === "Revenue").map(a => a.accountName)].filter((v, i, a) => a.indexOf(v) === i).map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <span className="text-slate-500 text-sm pt-2">Description</span>
                            <textarea rows={2} placeholder="Sales description"
                              value={editDraft.salesDescription || ""}
                              onChange={(e) => setEditDraft(p => ({ ...p, salesDescription: e.target.value }))}
                              disabled={editDraft.isSellable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 resize-none" />
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-slate-500 text-sm">Tax</span>
                            <select value={editDraft.salesTax || ""}
                              onChange={(e) => setEditDraft(p => ({ ...p, salesTax: e.target.value }))}
                              disabled={editDraft.isSellable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100">
                              <option value="">Select a Tax</option>
                              <option value="0">Tax-Free (0%)</option>
                              <option value="8.25">Standard Tax (8.25%)</option>
                              <option value="15">VAT (15%)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-5">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Purchase Information</h3>
                          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input type="checkbox" checked={editDraft.isPurchasable !== false}
                              onChange={(e) => setEditDraft(p => ({ ...p, isPurchasable: e.target.checked }))}
                              className="rounded h-4 w-4" />
                            <span className="text-slate-600 dark:text-slate-400">Purchasable</span>
                          </label>
                        </div>
                        <div className="space-y-4" style={{ opacity: editDraft.isPurchasable !== false ? 1 : 0.5 }}>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-red-500 text-sm font-medium">Cost Price*</span>
                            <div className="flex rounded-md border border-input bg-background overflow-hidden">
                              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm border-r border-border font-medium select-none">USD</div>
                              <input type="number" step="0.01" placeholder="0.00"
                                value={editDraft.purchasePrice ?? ""}
                                onChange={(e) => setEditDraft(p => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))}
                                disabled={editDraft.isPurchasable === false}
                                className="flex-1 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground disabled:opacity-50 dark:text-slate-100" />
                            </div>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-slate-500 text-sm">Account</span>
                            <select value={editDraft.purchaseAccount || "Cost of Goods Sold"}
                              onChange={(e) => setEditDraft(p => ({ ...p, purchaseAccount: e.target.value }))}
                              disabled={editDraft.isPurchasable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100">
                              {["Cost of Goods Sold", "Materials", "Labor", "Advertising Expense", "Office Supplies", ...coaStorage.getAll().filter(a => a.accountType === "Expense").map(a => a.accountName)].filter((v, i, a) => a.indexOf(v) === i).map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <span className="text-slate-500 text-sm pt-2">Description</span>
                            <textarea rows={2} placeholder="Purchase description"
                              value={editDraft.purchaseDescription || ""}
                              onChange={(e) => setEditDraft(p => ({ ...p, purchaseDescription: e.target.value }))}
                              disabled={editDraft.isPurchasable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 resize-none" />
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-slate-500 text-sm">Tax</span>
                            <select value={editDraft.purchaseTax || ""}
                              onChange={(e) => setEditDraft(p => ({ ...p, purchaseTax: e.target.value }))}
                              disabled={editDraft.isPurchasable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100">
                              <option value="">Select a Tax</option>
                              <option value="0">Tax-Free (0%)</option>
                              <option value="8.25">Standard Tax (8.25%)</option>
                              <option value="15">VAT (15%)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-slate-500 text-sm">Preferred Vendor</span>
                            <select value={editDraft.preferredVendor || ""}
                              onChange={(e) => setEditDraft(p => ({ ...p, preferredVendor: e.target.value }))}
                              disabled={editDraft.isPurchasable === false}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100">
                              <option value="">Select a Vendor</option>
                              {vendorStorage.getAll().map(v => (
                                <option key={v.id} value={v.name}>{v.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="editTrackInventory"
                          checked={editDraft.trackInventory !== false}
                          onChange={(e) => setEditDraft(p => ({ ...p, trackInventory: e.target.checked }))}
                          className="rounded h-4 w-4" />
                        <label htmlFor="editTrackInventory" className="text-sm font-medium cursor-pointer select-none">
                          Track Inventory for this item
                        </label>
                      </div>
                      {editDraft.trackInventory !== false && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 max-w-3xl">
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-sm text-slate-500">Stock On Hand</span>
                            <Input type="number" placeholder="0"
                              value={editDraft.stockOnHand ?? ""}
                              onChange={(e) => setEditDraft(p => ({ ...p, stockOnHand: parseInt(e.target.value) || 0 }))} />
                          </div>
                          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <span className="text-sm text-slate-500">Inventory Account</span>
                            <select value={editDraft.inventoryAccount || "Inventory Asset"}
                              onChange={(e) => setEditDraft(p => ({ ...p, inventoryAccount: e.target.value }))}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-slate-900 dark:text-slate-100">
                              <option value="Inventory Asset">Inventory Asset</option>
                              {coaStorage.getAll().filter(a => a.accountType === "Asset").map(a => a.accountName).filter(n => n !== "Inventory Asset").map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TRANSACTIONS TAB */}
                {detailTab === "transactions" && (() => {
                  const txns = getItemTransactions(selectedItem.name, selectedItem.id);
                  const typeColors: Record<string, string> = {
                    "Invoice": "bg-green-100 text-green-700",
                    "Bill": "bg-red-100 text-red-700",
                    "Quote": "bg-blue-100 text-blue-700",
                    "Purchase Order": "bg-orange-100 text-orange-700",
                    "Adjustment": "bg-amber-100 text-amber-700",
                  };
                  if (txns.length === 0) {
                    return (
                      <div className="bg-card rounded-xl border border-border p-16 text-center">
                        <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-medium text-muted-foreground">No transactions found</p>
                        <p className="text-sm text-muted-foreground mt-1">This item hasn't appeared in any invoices, bills, or orders yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border">
                          <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reference</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer / Vendor</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {txns.map((txn, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[txn.type] || "bg-slate-100 text-slate-700"}`}>
                                  {txn.type}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-medium font-mono text-xs">{txn.number}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</td>
                              <td className="px-5 py-3.5">{txn.counterparty}</td>
                              <td className="px-5 py-3.5 text-right font-medium">
                                {txn.type === "Adjustment" ? (
                                  <span className={txn.qty >= 0 ? "text-green-600" : "text-red-600"}>
                                    {txn.qty >= 0 ? "+" : ""}{txn.qty}
                                  </span>
                                ) : txn.qty}
                              </td>
                              <td className="px-5 py-3.5 text-right font-semibold">
                                {txn.type === "Adjustment" ? "—" : `$${txn.amount.toFixed(2)}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

              </div>
            </div>
          </DialogContent>
        </Dialog>
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
