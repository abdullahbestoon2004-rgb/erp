import {
  Customer,
  Vendor,
  Invoice,
  Bill,
  Payment,
  Expense,
  Quote,
  SalesOrder,
  PurchaseOrder,
  RecurringInvoice,
  PaymentReceived,
  PaymentMade,
  SalesReceipt,
  CreditNote,
  VendorCredit,
  BankAccount,
  BankTransaction,
  JournalEntry,
  COAAccount,
  Budget,
  FixedAsset,
  InventoryItem,
  PriceList,
  InventoryAdjustment,
  Project,
  Timesheet,
  OrgSettings,
  LineItem
} from "@/types";

const STORAGE_KEYS = {
  CUSTOMERS: "zoho_customers",
  VENDORS: "zoho_vendors",
  INVOICES: "zoho_invoices",
  BILLS: "zoho_bills",
  PAYMENTS: "zoho_payments",
  EXPENSES: "zoho_expenses",
  QUOTES: "zoho_quotes",
  SALES_ORDERS: "zoho_sales_orders",
  PURCHASE_ORDERS: "zoho_purchase_orders",
  RECURRING_INVOICES: "zoho_recurring_invoices",
  PAYMENTS_RECEIVED: "zoho_payments_received",
  PAYMENTS_MADE: "zoho_payments_made",
  SALES_RECEIPTS: "zoho_sales_receipts",
  CREDIT_NOTES: "zoho_credit_notes",
  VENDOR_CREDITS: "zoho_vendor_credits",
  BANK_ACCOUNTS: "zoho_bank_accounts",
  BANK_TRANSACTIONS: "zoho_bank_transactions",
  JOURNAL_ENTRIES: "zoho_journal_entries",
  COA_ACCOUNTS: "zoho_coa_accounts",
  BUDGETS: "zoho_budgets",
  FIXED_ASSETS: "zoho_fixed_assets",
  INVENTORY_ITEMS: "zoho_inventory_items",
  PRICE_LISTS: "zoho_price_lists",
  INVENTORY_ADJUSTMENTS: "zoho_inventory_adjustments",
  PROJECTS: "zoho_projects",
  TIMESHEETS: "zoho_timesheets",
  ORG_SETTINGS: "zoho_org_settings",
};

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getNextNumber(prefix: string, existingNumbers: string[]): string {
  const numbers = existingNumbers
    .map((num) => parseInt(num.replace(prefix, "")) || 0)
    .filter((n) => !isNaN(n));
  const nextNumber = (Math.max(...numbers, 0) + 1).toString().padStart(5, "0");
  return `${prefix}${nextNumber}`;
}

// Customer Storage
export const customerStorage = {
  getAll: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  add: (customer: Omit<Customer, "id" | "createdAt">): Customer => {
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = customerStorage.getAll();
    all.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(all));
    return newCustomer;
  },
  update: (id: string, updates: Partial<Customer>): Customer | null => {
    const all = customerStorage.getAll();
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = customerStorage.getAll();
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): Customer | null => {
    return customerStorage.getAll().find((c) => c.id === id) || null;
  },
};

// Vendor Storage
export const vendorStorage = {
  getAll: (): Vendor[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VENDORS);
    return data ? JSON.parse(data) : [];
  },
  add: (vendor: Omit<Vendor, "id" | "createdAt">): Vendor => {
    const newVendor: Vendor = {
      ...vendor,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = vendorStorage.getAll();
    all.push(newVendor);
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(all));
    return newVendor;
  },
  update: (id: string, updates: Partial<Vendor>): Vendor | null => {
    const all = vendorStorage.getAll();
    const index = all.findIndex((v) => v.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = vendorStorage.getAll();
    const filtered = all.filter((v) => v.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): Vendor | null => {
    return vendorStorage.getAll().find((v) => v.id === id) || null;
  },
};

// Invoice Storage
export const invoiceStorage = {
  getAll: (): Invoice[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },
  add: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Invoice => {
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = invoiceStorage.getAll();
    all.push(newInvoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(all));
    return newInvoice;
  },
  update: (id: string, updates: Partial<Invoice>): Invoice | null => {
    const all = invoiceStorage.getAll();
    const index = all.findIndex((i) => i.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = invoiceStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): Invoice | null => {
    return invoiceStorage.getAll().find((i) => i.id === id) || null;
  },
  getNextNumber: (): string => {
    const all = invoiceStorage.getAll();
    return getNextNumber("INV-", all.map((i) => i.invoiceNumber));
  },
};

// Bill Storage
export const billStorage = {
  getAll: (): Bill[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BILLS);
    return data ? JSON.parse(data) : [];
  },
  add: (bill: Omit<Bill, "id" | "createdAt" | "updatedAt">): Bill => {
    const newBill: Bill = {
      ...bill,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = billStorage.getAll();
    all.push(newBill);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(all));
    return newBill;
  },
  update: (id: string, updates: Partial<Bill>): Bill | null => {
    const all = billStorage.getAll();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = billStorage.getAll();
    const filtered = all.filter((b) => b.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): Bill | null => {
    return billStorage.getAll().find((b) => b.id === id) || null;
  },
  getNextNumber: (): string => {
    const all = billStorage.getAll();
    return getNextNumber("BILL-", all.map((b) => b.billNumber));
  },
};

// Quote Storage
export const quoteStorage = {
  getAll: (): Quote[] => {
    const data = localStorage.getItem(STORAGE_KEYS.QUOTES);
    return data ? JSON.parse(data) : [];
  },
  add: (quote: Omit<Quote, "id" | "createdAt" | "updatedAt">): Quote => {
    const newQuote: Quote = {
      ...quote,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = quoteStorage.getAll();
    all.push(newQuote);
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(all));
    return newQuote;
  },
  update: (id: string, updates: Partial<Quote>): Quote | null => {
    const all = quoteStorage.getAll();
    const index = all.findIndex((q) => q.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = quoteStorage.getAll();
    const filtered = all.filter((q) => q.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): Quote | null => {
    return quoteStorage.getAll().find((q) => q.id === id) || null;
  },
  getNextNumber: (): string => {
    const all = quoteStorage.getAll();
    return getNextNumber("QT-", all.map((q) => q.quoteNumber));
  },
};

// Sales Order Storage
export const salesOrderStorage = {
  getAll: (): SalesOrder[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SALES_ORDERS);
    return data ? JSON.parse(data) : [];
  },
  add: (order: Omit<SalesOrder, "id" | "createdAt" | "updatedAt">): SalesOrder => {
    const newOrder: SalesOrder = {
      ...order,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = salesOrderStorage.getAll();
    all.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(all));
    return newOrder;
  },
  update: (id: string, updates: Partial<SalesOrder>): SalesOrder | null => {
    const all = salesOrderStorage.getAll();
    const index = all.findIndex((o) => o.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = salesOrderStorage.getAll();
    const filtered = all.filter((o) => o.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): SalesOrder | null => {
    return salesOrderStorage.getAll().find((o) => o.id === id) || null;
  },
  getNextNumber: (): string => {
    const all = salesOrderStorage.getAll();
    return getNextNumber("SO-", all.map((o) => o.orderNumber));
  },
};

// Purchase Order Storage
export const purchaseOrderStorage = {
  getAll: (): PurchaseOrder[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
    return data ? JSON.parse(data) : [];
  },
  add: (order: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">): PurchaseOrder => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = purchaseOrderStorage.getAll();
    all.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(all));
    return newOrder;
  },
  update: (id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | null => {
    const all = purchaseOrderStorage.getAll();
    const index = all.findIndex((o) => o.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = purchaseOrderStorage.getAll();
    const filtered = all.filter((o) => o.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(filtered));
    return true;
  },
  getById: (id: string): PurchaseOrder | null => {
    return purchaseOrderStorage.getAll().find((o) => o.id === id) || null;
  },
  getNextNumber: (): string => {
    const all = purchaseOrderStorage.getAll();
    return getNextNumber("PO-", all.map((o) => o.poNumber));
  },
};

// Recurring Invoices Storage
export const recurringInvoiceStorage = {
  getAll: (): RecurringInvoice[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RECURRING_INVOICES);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<RecurringInvoice, "id" | "createdAt">): RecurringInvoice => {
    const newItem: RecurringInvoice = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = recurringInvoiceStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.RECURRING_INVOICES, JSON.stringify(all));
    return newItem;
  },
  update: (id: string, updates: Partial<RecurringInvoice>): RecurringInvoice | null => {
    const all = recurringInvoiceStorage.getAll();
    const index = all.findIndex((i) => i.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.RECURRING_INVOICES, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = recurringInvoiceStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.RECURRING_INVOICES, JSON.stringify(filtered));
    return true;
  }
};

// Payments Received Storage
export const paymentReceivedStorage = {
  getAll: (): PaymentReceived[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS_RECEIVED);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<PaymentReceived, "id" | "createdAt">): PaymentReceived => {
    const newItem: PaymentReceived = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = paymentReceivedStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS_RECEIVED, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = paymentReceivedStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.PAYMENTS_RECEIVED, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = paymentReceivedStorage.getAll();
    return getNextNumber("PAY-IN-", all.map((p) => p.paymentNumber));
  }
};

// Payments Made Storage
export const paymentMadeStorage = {
  getAll: (): PaymentMade[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS_MADE);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<PaymentMade, "id" | "createdAt">): PaymentMade => {
    const newItem: PaymentMade = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = paymentMadeStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS_MADE, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = paymentMadeStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.PAYMENTS_MADE, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = paymentMadeStorage.getAll();
    return getNextNumber("PAY-OUT-", all.map((p) => p.paymentNumber));
  }
};

// Sales Receipts Storage
export const salesReceiptStorage = {
  getAll: (): SalesReceipt[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SALES_RECEIPTS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<SalesReceipt, "id" | "createdAt">): SalesReceipt => {
    const newItem: SalesReceipt = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = salesReceiptStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.SALES_RECEIPTS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = salesReceiptStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.SALES_RECEIPTS, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = salesReceiptStorage.getAll();
    return getNextNumber("REC-", all.map((p) => p.receiptNumber));
  }
};

// Credit Notes Storage
export const creditNoteStorage = {
  getAll: (): CreditNote[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CREDIT_NOTES);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<CreditNote, "id" | "createdAt">): CreditNote => {
    const newItem: CreditNote = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = creditNoteStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = creditNoteStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = creditNoteStorage.getAll();
    return getNextNumber("CN-", all.map((p) => p.creditNoteNumber));
  }
};

// Vendor Credits Storage
export const vendorCreditStorage = {
  getAll: (): VendorCredit[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VENDOR_CREDITS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<VendorCredit, "id" | "createdAt">): VendorCredit => {
    const newItem: VendorCredit = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = vendorCreditStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.VENDOR_CREDITS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = vendorCreditStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.VENDOR_CREDITS, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = vendorCreditStorage.getAll();
    return getNextNumber("VC-", all.map((p) => p.creditNumber));
  }
};

// Expense Storage
export const expenseStorage = {
  getAll: (): Expense[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<Expense, "id" | "createdAt">): Expense => {
    const newItem: Expense = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = expenseStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
    return newItem;
  },
  update: (id: string, updates: Partial<Expense>): Expense | null => {
    const all = expenseStorage.getAll();
    const index = all.findIndex((i) => i.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = expenseStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = expenseStorage.getAll();
    return getNextNumber("EXP-", all.map((e) => e.expenseNumber));
  }
};

// Bank Accounts Storage
export const bankAccountStorage = {
  getAll: (): BankAccount[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<BankAccount, "id" | "createdAt">): BankAccount => {
    const newItem: BankAccount = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = bankAccountStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(all));
    return newItem;
  },
  update: (id: string, updates: Partial<BankAccount>): BankAccount | null => {
    const all = bankAccountStorage.getAll();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = bankAccountStorage.getAll();
    const filtered = all.filter((a) => a.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(filtered));
    return true;
  }
};

// Bank Transactions Storage
export const bankTransactionStorage = {
  getAll: (): BankTransaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BANK_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<BankTransaction, "id" | "createdAt">): BankTransaction => {
    const newItem: BankTransaction = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = bankTransactionStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, JSON.stringify(all));
    return newItem;
  },
  update: (id: string, updates: Partial<BankTransaction>): BankTransaction | null => {
    const all = bankTransactionStorage.getAll();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = bankTransactionStorage.getAll();
    const filtered = all.filter((t) => t.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, JSON.stringify(filtered));
    return true;
  }
};

// Journal Entries Storage
export const journalEntryStorage = {
  getAll: (): JournalEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<JournalEntry, "id" | "createdAt">): JournalEntry => {
    const newItem: JournalEntry = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = journalEntryStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = journalEntryStorage.getAll();
    const filtered = all.filter((j) => j.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = journalEntryStorage.getAll();
    return getNextNumber("JN-", all.map((j) => j.journalNumber));
  }
};

// Chart of Accounts Storage
export const coaStorage = {
  getAll: (): COAAccount[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COA_ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: COAAccount): COAAccount => {
    const all = coaStorage.getAll();
    all.push(item);
    localStorage.setItem(STORAGE_KEYS.COA_ACCOUNTS, JSON.stringify(all));
    return item;
  }
};

// Budgets Storage
export const budgetStorage = {
  getAll: (): Budget[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<Budget, "id" | "createdAt">): Budget => {
    const newItem: Budget = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = budgetStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = budgetStorage.getAll();
    const filtered = all.filter((b) => b.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filtered));
    return true;
  }
};

// Fixed Assets Storage
export const fixedAssetStorage = {
  getAll: (): FixedAsset[] => {
    const data = localStorage.getItem(STORAGE_KEYS.FIXED_ASSETS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<FixedAsset, "id" | "createdAt">): FixedAsset => {
    const newItem: FixedAsset = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = fixedAssetStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.FIXED_ASSETS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = fixedAssetStorage.getAll();
    const filtered = all.filter((f) => f.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.FIXED_ASSETS, JSON.stringify(filtered));
    return true;
  }
};

// Inventory Items Storage
export const inventoryItemStorage = {
  getAll: (): InventoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<InventoryItem, "id" | "createdAt">): InventoryItem => {
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = inventoryItemStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(all));
    return newItem;
  },
  update: (id: string, updates: Partial<InventoryItem>): InventoryItem | null => {
    const all = inventoryItemStorage.getAll();
    const index = all.findIndex((i) => i.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = inventoryItemStorage.getAll();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(filtered));
    return true;
  }
};

// Price Lists Storage
export const priceListStorage = {
  getAll: (): PriceList[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRICE_LISTS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<PriceList, "id" | "createdAt">): PriceList => {
    const newItem: PriceList = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = priceListStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.PRICE_LISTS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = priceListStorage.getAll();
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.PRICE_LISTS, JSON.stringify(filtered));
    return true;
  }
};

// Inventory Adjustments Storage
export const inventoryAdjustmentStorage = {
  getAll: (): InventoryAdjustment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY_ADJUSTMENTS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<InventoryAdjustment, "id" | "createdAt">): InventoryAdjustment => {
    const newItem: InventoryAdjustment = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = inventoryAdjustmentStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ADJUSTMENTS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = inventoryAdjustmentStorage.getAll();
    const filtered = all.filter((a) => a.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ADJUSTMENTS, JSON.stringify(filtered));
    return true;
  },
  getNextNumber: (): string => {
    const all = inventoryAdjustmentStorage.getAll();
    return getNextNumber("IA-", all.map((a) => a.adjustmentNumber));
  }
};

// Projects Storage
export const projectStorage = {
  getAll: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<Project, "id" | "createdAt">): Project => {
    const newItem: Project = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = projectStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    return newItem;
  },
  update: (id: string, updates: Partial<Project>): Project | null => {
    const all = projectStorage.getAll();
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    return all[index];
  },
  delete: (id: string): boolean => {
    const all = projectStorage.getAll();
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    return true;
  }
};

// Timesheets Storage
export const timesheetStorage = {
  getAll: (): Timesheet[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
    return data ? JSON.parse(data) : [];
  },
  add: (item: Omit<Timesheet, "id" | "createdAt">): Timesheet => {
    const newItem: Timesheet = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    const all = timesheetStorage.getAll();
    all.push(newItem);
    localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(all));
    return newItem;
  },
  delete: (id: string): boolean => {
    const all = timesheetStorage.getAll();
    const filtered = all.filter((t) => t.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(filtered));
    return true;
  }
};

// Org Settings Storage
export const orgSettingsStorage = {
  get: (): OrgSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.ORG_SETTINGS);
    return data ? JSON.parse(data) : {
      companyName: "ABSystem Reference Inc.",
      fiscalYear: "January-December",
      currency: "USD",
      taxRate: 8.25
    };
  },
  set: (settings: OrgSettings): void => {
    localStorage.setItem(STORAGE_KEYS.ORG_SETTINGS, JSON.stringify(settings));
  }
};

// Seed Database Function
export function seedDatabase() {
  if (customerStorage.getAll().length === 0) {
    const c1 = customerStorage.add({ name: "Acme Corp", email: "billing@acme.com", phone: "555-0100", address: "123 Industrial Way", city: "Metropolis", state: "NY", zipCode: "10001", country: "USA", taxId: "12-34567" });
    const c2 = customerStorage.add({ name: "Stark Industries", email: "accounting@stark.com", phone: "555-3000", address: "10880 Malibu Point", city: "Los Angeles", state: "CA", zipCode: "90265", country: "USA" });
    customerStorage.add({ name: "Wayne Enterprises", email: "finance@wayne.com", phone: "555-4000", address: "1007 Mountain Drive", city: "Gotham", state: "NJ", zipCode: "07001", country: "USA" });

    // Seed Invoices
    const inv1 = invoiceStorage.add({
      invoiceNumber: "INV-00001",
      customerId: c1.id,
      customerName: c1.name,
      date: Date.now() - 15 * 24 * 60 * 60 * 1000,
      dueDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
      lineItems: [{ id: "li-1", itemName: "Consulting Services", description: "Strategic SaaS advisory", quantity: 10, unitPrice: 150, taxRate: 8.25, amount: 1500 }],
      subtotal: 1500,
      taxAmount: 123.75,
      total: 1623.75,
      status: "sent"
    });
    
    invoiceStorage.add({
      invoiceNumber: "INV-00002",
      customerId: c2.id,
      customerName: c2.name,
      date: Date.now() - 40 * 24 * 60 * 60 * 1000,
      dueDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      lineItems: [{ id: "li-2", itemName: "Custom Software Engineering", description: "Iron Man HUD interface update", quantity: 1, unitPrice: 25000, taxRate: 0, amount: 25000 }],
      subtotal: 25000,
      taxAmount: 0,
      total: 25000,
      status: "overdue"
    });
  }

  if (vendorStorage.getAll().length === 0) {
    const v1 = vendorStorage.add({ name: "Amazon Web Services", email: "billing@aws.com", phone: "800-AWS-BILL", address: "410 Terry Ave N", city: "Seattle", state: "WA", zipCode: "98109", country: "USA" });
    const v2 = vendorStorage.add({ name: "GitHub Inc.", email: "accounts@github.com", phone: "888-GIT-HUBB", address: "88 Colin P Kelly Jr St", city: "San Francisco", state: "CA", zipCode: "94107", country: "USA" });

    // Seed Bills
    billStorage.add({
      billNumber: "BILL-00001",
      vendorId: v1.id,
      vendorName: v1.name,
      date: Date.now() - 10 * 24 * 60 * 60 * 1000,
      dueDate: Date.now() + 20 * 24 * 60 * 60 * 1000,
      lineItems: [{ id: "li-b1", itemName: "Cloud Hosting - May 2026", description: "EC2 and RDS databases", quantity: 1, unitPrice: 480, taxRate: 0, amount: 480 }],
      subtotal: 480,
      taxAmount: 0,
      total: 480,
      status: "approved"
    });
  }

  // Seed COA
  if (coaStorage.getAll().length === 0) {
    coaStorage.add({ id: "coa-1", accountName: "Petty Cash", accountType: "Asset", code: "1010" });
    coaStorage.add({ id: "coa-2", accountName: "Stripe Clearing Account", accountType: "Asset", code: "1020" });
    coaStorage.add({ id: "coa-3", accountName: "Accounts Receivable", accountType: "Asset", code: "1200" });
    coaStorage.add({ id: "coa-4", accountName: "Office Supplies", accountType: "Expense", code: "6010" });
    coaStorage.add({ id: "coa-5", accountName: "Rent Expense", accountType: "Expense", code: "6100" });
    coaStorage.add({ id: "coa-6", accountName: "SaaS & Subscriptions", accountType: "Expense", code: "6250" });
    coaStorage.add({ id: "coa-7", accountName: "Sales Income", accountType: "Revenue", code: "4000" });
    coaStorage.add({ id: "coa-8", accountName: "Accounts Payable", accountType: "Liability", code: "2000" });
  }

  // Seed Bank Accounts
  if (bankAccountStorage.getAll().length === 0) {
    bankAccountStorage.add({ accountName: "Chase Checking", accountType: "Checking", accountNumber: "****5678", bankName: "Chase Bank", balance: 28450.25 });
    bankAccountStorage.add({ accountName: "SVB Savings", accountType: "Savings", accountNumber: "****9012", bankName: "Silicon Valley Bank", balance: 145000.00 });
    bankAccountStorage.add({ accountName: "AMEX Business Card", accountType: "Credit Card", accountNumber: "****4321", bankName: "American Express", balance: -3840.50 });
  }

  // Seed Bank Transactions
  if (bankTransactionStorage.getAll().length === 0) {
    bankTransactionStorage.add({ date: Date.now() - 2 * 24 * 60 * 60 * 1000, description: "Stripe Transfer Payout", amount: 1540.00, type: "deposit", status: "uncategorized" });
    bankTransactionStorage.add({ date: Date.now() - 3 * 24 * 60 * 60 * 1000, description: "AMEX Auto-Pay Card Settlement", amount: -3840.50, type: "withdrawal", status: "uncategorized" });
    bankTransactionStorage.add({ date: Date.now() - 5 * 24 * 60 * 60 * 1000, description: "Invoice INV-00001 Payment", amount: 1623.75, type: "deposit", status: "uncategorized" });
    bankTransactionStorage.add({ date: Date.now() - 8 * 24 * 60 * 60 * 1000, description: "Google Workspace Subscription", amount: -60.00, type: "withdrawal", status: "categorized", category: "SaaS & Subscriptions" });
    bankTransactionStorage.add({ date: Date.now() - 10 * 24 * 60 * 60 * 1000, description: "Office Depot - Paper & Pens", amount: -45.80, type: "withdrawal", status: "categorized", category: "Office Supplies" });
    bankTransactionStorage.add({ date: Date.now() - 12 * 24 * 60 * 60 * 1000, description: "Rent Payment LLC", amount: -2500.00, type: "withdrawal", status: "categorized", category: "Rent Expense" });
  }

  // Seed Quotes
  if (quoteStorage.getAll().length === 0) {
    const custs = customerStorage.getAll();
    if (custs.length > 0) {
      quoteStorage.add({
        quoteNumber: "QT-00001",
        customerId: custs[0].id,
        customerName: custs[0].name,
        date: Date.now() - 5 * 24 * 60 * 60 * 1000,
        dueDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
        lineItems: [{ id: "li-q1", itemName: "Security Audit & Architecture Review", description: "Evaluate networks and cloud permissions", quantity: 1, unitPrice: 3500, taxRate: 0, amount: 3500 }],
        subtotal: 3500,
        taxAmount: 0,
        total: 3500,
        notes: "Valid for 30 days.",
        status: "sent"
      });
    }
  }

  // Seed Inventory Items
  if (inventoryItemStorage.getAll().length === 0) {
    inventoryItemStorage.add({ name: "Standard SaaS Licence", sku: "LIC-STD", unit: "user/month", salesPrice: 29.00, purchasePrice: 10.00, stockOnHand: 150, description: "Standard business licence" });
    inventoryItemStorage.add({ name: "Premium Enterprise Licence", sku: "LIC-ENT", unit: "user/month", salesPrice: 79.00, purchasePrice: 25.00, stockOnHand: 50, description: "Full enterprise level capabilities" });
    inventoryItemStorage.add({ name: "Custom API Integration Token", sku: "TOK-API", unit: "token", salesPrice: 150.00, purchasePrice: 0.00, stockOnHand: 1000, description: "Developer token for endpoints integration" });
  }

  // Seed Expenses
  if (expenseStorage.getAll().length === 0) {
    expenseStorage.add({ expenseNumber: "EXP-00001", category: "Rent Expense", amount: 2500, date: Date.now() - 12 * 24 * 60 * 60 * 1000, paymentAccount: "Chase Checking", description: "Monthly office rental fee", billable: false, status: "unbilled" });
    expenseStorage.add({ expenseNumber: "EXP-00002", category: "SaaS & Subscriptions", amount: 60, date: Date.now() - 8 * 24 * 60 * 60 * 1000, paymentAccount: "AMEX Business Card", description: "Google Workspace invoice", billable: false, status: "unbilled" });
    expenseStorage.add({ expenseNumber: "EXP-00003", category: "Office Supplies", amount: 45.80, date: Date.now() - 10 * 24 * 60 * 60 * 1000, paymentAccount: "AMEX Business Card", description: "Printer paper and staples", billable: false, status: "unbilled" });
  }

  // Seed Projects & Timesheets
  if (projectStorage.getAll().length === 0) {
    const custs = customerStorage.getAll();
    if (custs.length > 0) {
      const p1 = projectStorage.add({ projectName: "E-Commerce App Development", billingMethod: "Hourly Rate", customerId: custs[0].id, customerName: custs[0].name, rate: 125, budget: 15000, status: "active" });
      const p2 = projectStorage.add({ projectName: "Malibu House Smart Grid", billingMethod: "Fixed Cost", customerId: custs[1].id, customerName: custs[1].name, budget: 85000, status: "active" });

      timesheetStorage.add({ projectId: p1.id, projectName: p1.projectName, employeeName: "Sarah Connor", date: Date.now() - 1 * 24 * 60 * 60 * 1000, hours: 6.5, billable: true, description: "React frontend coding and checkout wiring" });
      timesheetStorage.add({ projectId: p1.id, projectName: p1.projectName, employeeName: "John Doe", date: Date.now() - 2 * 24 * 60 * 60 * 1000, hours: 4.0, billable: true, description: "Backend database setup & Prisma schema" });
      timesheetStorage.add({ projectId: p2.id, projectName: p2.projectName, employeeName: "Tony Stark", date: Date.now() - 1 * 24 * 60 * 60 * 1000, hours: 8.0, billable: false, description: "Reviewing JARVIS grid logic" });
    }
  }

  // Seed Journal Entries
  if (journalEntryStorage.getAll().length === 0) {
    journalEntryStorage.add({
      journalNumber: "JN-00001",
      date: Date.now() - 30 * 24 * 60 * 60 * 1000,
      notes: "Opening balances adjustment",
      lines: [
        { id: "jl-1", accountId: "coa-1", accountName: "Petty Cash", debit: 500, credit: 0 },
        { id: "jl-2", accountId: "coa-7", accountName: "Sales Income", debit: 0, credit: 500 }
      ],
      totalDebit: 500,
      totalCredit: 500
    });
  }
}

// Auto-seed on load
seedDatabase();
