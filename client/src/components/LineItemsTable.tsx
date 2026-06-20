import { useState } from "react";
import { GripVertical, Image as ImageIcon, Trash2, Plus, Calculator, ChevronDown } from "lucide-react";
import { LineItem } from "@/types";
import { inventoryItemStorage } from "@/lib/storage";

const GRID = "32px 44px 1fr 82px 90px 116px 148px 88px 36px";

const TAX_OPTIONS = [
  { label: "Tax Exempt (0%)", value: 0 },
  { label: "Standard Tax (8.25%)", value: 8.25 },
  { label: "VAT (15%)", value: 15 },
];

function calcAmount(item: LineItem): number {
  const base = (item.quantity || 0) * (item.unitPrice || 0);
  const disc = (item as any).discount || 0;
  const discAmt =
    (item as any).discountType === "flat"
      ? Math.min(disc, base)
      : (base * disc) / 100;
  return Math.max(0, base - discAmt);
}

interface Props {
  value: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export default function LineItemsTable({ value, onChange }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // searchMap[item.id] = current search text while dropdown is open
  const [searchMap, setSearchMap] = useState<Record<string, string>>({});

  const inventory = inventoryItemStorage.getAll();

  const update = (idx: number, patch: Partial<LineItem & { discount?: number; discountType?: "%" | "flat" }>) => {
    onChange(
      value.map((item, i) => {
        if (i !== idx) return item;
        const merged = { ...item, ...patch };
        merged.amount = calcAmount(merged);
        return merged;
      })
    );
  };

  const add = () => {
    onChange([
      ...value,
      { id: Date.now().toString(), itemName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 } as any,
    ]);
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const pick = (idx: number, inv: ReturnType<typeof inventoryItemStorage.getAll>[0]) => {
    update(idx, {
      itemName: inv.name,
      description: (inv.salesDescription || inv.description || "") as string,
      unitPrice: inv.salesPrice || 0,
      taxRate: inv.salesTax ? parseFloat(String(inv.salesTax)) || 0 : 0,
    });
    const id = value[idx]?.id;
    if (id) setSearchMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    setOpenIdx(null);
  };

  const handleFocus = (idx: number) => {
    const id = value[idx]?.id;
    // Set search to empty string (shows all items)
    if (id) setSearchMap(prev => ({ ...prev, [id]: "" }));
    setOpenIdx(idx);
  };

  const handleBlur = (idx: number) => {
    setTimeout(() => {
      setOpenIdx(null);
      // Revert display to committed item.itemName
      const id = value[idx]?.id;
      if (id) setSearchMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    }, 180);
  };

  const getDisplayValue = (idx: number): string => {
    const item = value[idx];
    if (!item) return "";
    const search = searchMap[item.id];
    return openIdx === idx && search !== undefined ? search : (item.itemName || "");
  };

  return (
    <div>
      {/*
        overflow-visible is critical here — without it the dropdown gets clipped
        by the container. We handle rounded corners on header/last-row instead.
      */}
      <div className="w-full border border-[#e2e8f0] rounded-lg overflow-visible">

        {/* Header — overflow-hidden + rounded-t keeps bg clipped to rounded top corners */}
        <div
          className="grid bg-[#f8fafc] border-b border-[#e2e8f0] select-none overflow-hidden rounded-t-lg"
          style={{ gridTemplateColumns: GRID }}
        >
          <div className="px-2 py-3" />
          <div className="px-2 py-3" />
          <div className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Item Details</div>
          <div className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] text-center border-l border-[#e2e8f0]">Quantity</div>
          <div className="px-2 py-3 border-l border-[#e2e8f0] flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
            Rate <Calculator className="h-3 w-3 shrink-0" />
          </div>
          <div className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] text-center border-l border-[#e2e8f0]">Discount</div>
          <div className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] text-center border-l border-[#e2e8f0]">Tax</div>
          <div className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] text-right border-l border-[#e2e8f0]">Amount</div>
          <div className="px-1 py-3 border-l border-[#e2e8f0]" />
        </div>

        {/* Rows */}
        {value.map((item, idx) => {
          const discountType = (item as any).discountType || "%";
          const discount = (item as any).discount ?? 0;
          const query = openIdx === idx ? (searchMap[item.id] ?? "") : "";
          const filtered = inventory.filter(
            (i) => !query || i.name.toLowerCase().includes(query.toLowerCase())
          );
          const selectedInv = inventory.find(i => i.name === item.itemName);

          return (
            <div
              key={item.id}
              className="grid group border-b border-[#e2e8f0] last:border-b-0 bg-white hover:bg-[#f8fafc]/70 transition-colors"
              style={{ gridTemplateColumns: GRID }}
            >
              {/* Drag handle */}
              <div className="flex items-start justify-center px-1 pt-3 pb-2 cursor-grab text-[#cbd5e1]">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Image — shows actual item image when selected */}
              <div className="flex items-start justify-center px-1 pt-3 pb-2">
                <div className="w-7 h-7 rounded border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center overflow-hidden">
                  {selectedInv?.imageUrl ? (
                    <img src={selectedInv.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-[#c8d3e0]" />
                  )}
                </div>
              </div>

              {/* Item selector — search-as-you-type, inventory only */}
              <div className="px-3 py-2.5 relative min-w-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={getDisplayValue(idx)}
                    placeholder="Search items…"
                    onChange={(e) => {
                      const id = value[idx]?.id;
                      if (id) setSearchMap(prev => ({ ...prev, [id]: e.target.value }));
                      setOpenIdx(idx);
                    }}
                    onFocus={() => handleFocus(idx)}
                    onBlur={() => handleBlur(idx)}
                    className="w-full bg-transparent border-0 text-[#374151] placeholder:text-[#aab4c0] text-sm focus:outline-none pr-5"
                    autoComplete="off"
                  />
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
                </div>

                {/* Description sub-line */}
                {item.description ? (
                  <input
                    type="text"
                    value={item.description}
                    placeholder="Description…"
                    onChange={(e) => update(idx, { description: e.target.value })}
                    className="w-full bg-transparent border-0 text-[#9ca3af] text-xs focus:outline-none mt-0.5"
                  />
                ) : null}

                {/* Search dropdown — renders OUTSIDE the overflow-hidden row */}
                {openIdx === idx && (
                  <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-[#e2e8f0] rounded-md shadow-xl max-h-52 overflow-y-auto" style={{ zIndex: 9999 }}>
                    {inventory.length === 0 ? (
                      <div className="px-4 py-5 text-center text-sm text-[#9ca3af]">
                        No items in catalog.
                        <br />
                        <span className="text-xs">Add items in the Items section first.</span>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="px-4 py-4 text-center text-sm text-[#9ca3af]">
                        No items match "<span className="font-medium text-[#374151]">{query}</span>"
                      </div>
                    ) : (
                      filtered.map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onMouseDown={() => pick(idx, inv)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-[#eef2fc] text-sm flex items-center gap-2.5 border-b border-[#f1f5f9] last:border-0 transition-colors ${
                            item.itemName === inv.name ? "bg-[#eef2fc]" : ""
                          }`}
                        >
                          <div className="w-7 h-7 rounded border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0 overflow-hidden">
                            {inv.imageUrl ? (
                              <img src={inv.imageUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <ImageIcon className="h-3 w-3 text-[#cbd5e1]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#374151] truncate">{inv.name}</p>
                            {inv.sku && <p className="text-[10px] text-[#9ca3af]">{inv.sku}</p>}
                          </div>
                          <span className="text-[#64748b] text-xs font-medium shrink-0">
                            ${(inv.salesPrice ?? 0).toFixed(2)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="border-l border-[#e2e8f0] flex items-center px-2 py-2.5">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => update(idx, { quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full text-center bg-transparent border-0 text-sm text-[#374151] focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Rate */}
              <div className="border-l border-[#e2e8f0] flex items-center px-2 py-2.5">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => update(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full text-center bg-transparent border-0 text-sm text-[#374151] focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Discount */}
              <div className="border-l border-[#e2e8f0] flex items-center gap-1 px-2 py-2.5">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => update(idx, { discount: parseFloat(e.target.value) || 0 } as any)}
                  className="w-10 text-center bg-transparent border-0 text-sm text-[#374151] focus:outline-none"
                  step="0.01"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => update(idx, { discountType: discountType === "flat" ? "%" : "flat" } as any)}
                  className="flex items-center gap-0.5 text-xs font-medium text-[#374151] border border-[#d1d5db] rounded px-1.5 py-[3px] hover:bg-[#f1f5f9] transition-colors shrink-0"
                >
                  <span>{discountType === "flat" ? "$" : "%"}</span>
                  <ChevronDown className="h-2.5 w-2.5 text-[#9ca3af]" />
                </button>
              </div>

              {/* Tax */}
              <div className="border-l border-[#e2e8f0] flex items-center px-2 py-2.5">
                <div className="relative w-full">
                  <select
                    value={item.taxRate}
                    onChange={(e) => update(idx, { taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full appearance-none bg-transparent border-0 text-sm text-[#374151] focus:outline-none cursor-pointer pr-5"
                  >
                    <option value="">Select a Tax</option>
                    {TAX_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                </div>
              </div>

              {/* Amount */}
              <div className="border-l border-[#e2e8f0] flex items-center justify-end px-3 py-2.5">
                <span className="font-semibold text-sm text-[#111827]">{item.amount.toFixed(2)}</span>
              </div>

              {/* Delete */}
              <div className="border-l border-[#e2e8f0] flex items-center justify-center px-1 py-2.5">
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#ef4444] hover:text-red-600 p-1 rounded hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1.5 text-sm text-[#0052cc] hover:text-[#003d9b] font-medium px-2 py-1.5 rounded hover:bg-[#eef2fc] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Another Line
      </button>
    </div>
  );
}
