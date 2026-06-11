export interface LineItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Customer {
  id: string;
  createdAt: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId?: string;
}

export interface Vendor {
  id: string;
  createdAt: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId?: string;
}

export interface Invoice {
  id: string;
  createdAt: number;
  updatedAt: number;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: number;
  dueDate: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue";
}

export interface Bill {
  id: string;
  createdAt: number;
  updatedAt: number;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  date: number;
  dueDate: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: "draft" | "received" | "approved" | "paid" | "overdue";
}

export interface Quote {
  id: string;
  createdAt: number;
  updatedAt: number;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  date: number;
  dueDate: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: "draft" | "sent" | "accepted" | "declined" | "invoiced";
}

export interface SalesOrder {
  id: string;
  createdAt: number;
  updatedAt: number;
  orderNumber: string;
}

export interface PurchaseOrder {
  id: string;
  createdAt: number;
  updatedAt: number;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: number;
  deliveryDate?: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: "draft" | "issued" | "billed" | "closed";
}

export interface Payment {
  id: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  createdAt: number;
  expenseNumber: string;
  category: string;
  amount: number;
  date: number;
  paymentAccount: string;
  vendorName?: string;
  description?: string;
  billable: boolean;
  status: "unbilled" | "invoiced" | "reimbursed";
}

export interface RecurringInvoice {
  id: string;
  createdAt: number;
  customerId: string;
  customerName: string;
  frequency: "weekly" | "monthly" | "yearly";
  nextInvoiceDate: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "active" | "paused";
}

export interface PaymentReceived {
  id: string;
  createdAt: number;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  date: number;
  paymentMode: "Cash" | "Bank Transfer" | "Credit Card" | "Check";
  referenceNumber?: string;
}

export interface PaymentMade {
  id: string;
  createdAt: number;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  billId?: string;
  billNumber?: string;
  amount: number;
  date: number;
  paymentMode: "Cash" | "Bank Transfer" | "Credit Card" | "Check";
  referenceNumber?: string;
}

export interface SalesReceipt {
  id: string;
  createdAt: number;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  date: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMode: "Cash" | "Bank Transfer" | "Credit Card";
  status: "completed" | "draft";
}

export interface CreditNote {
  id: string;
  createdAt: number;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  date: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "open" | "closed";
}

export interface VendorCredit {
  id: string;
  createdAt: number;
  creditNumber: string;
  vendorId: string;
  vendorName: string;
  date: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "open" | "closed";
}

export interface BankAccount {
  id: string;
  createdAt: number;
  accountName: string;
  accountType: "Checking" | "Savings" | "Credit Card";
  accountNumber: string;
  bankName: string;
  balance: number;
}

export interface BankTransaction {
  id: string;
  createdAt: number;
  date: number;
  description: string;
  amount: number;
  type: "deposit" | "withdrawal";
  status: "uncategorized" | "categorized" | "matched";
  category?: string;
  matchedDocumentId?: string;
  matchedDocumentType?: "Invoice" | "Bill" | "Payment";
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  createdAt: number;
  journalNumber: string;
  date: number;
  reference?: string;
  notes: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
}

export interface COAAccount {
  id: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  code: string;
  description?: string;
}

export interface Budget {
  id: string;
  createdAt: number;
  year: number;
  budgetName: string;
  entries: { accountId: string; accountName: string; budgetedAmount: number }[];
}

export interface FixedAsset {
  id: string;
  createdAt: number;
  assetName: string;
  assetCode: string;
  purchaseDate: number;
  purchaseValue: number;
  depreciationMethod: "Straight Line" | "Declining Balance";
  rate: number;
  bookValue: number;
}

export interface InventoryItem {
  id: string;
  createdAt: number;
  name: string;
  sku: string;
  unit: string;
  salesPrice: number;
  purchasePrice: number;
  stockOnHand: number;
  description?: string;
  
  // New fields matching the Zoho Books form
  type?: "goods" | "service";
  imageUrl?: string;
  isSellable?: boolean;
  salesAccount?: string;
  salesDescription?: string;
  salesTax?: string;
  isPurchasable?: boolean;
  purchaseAccount?: string;
  purchaseDescription?: string;
  purchaseTax?: string;
  preferredVendor?: string;
  trackInventory?: boolean;
  inventoryAccount?: string;
}

export interface PriceList {
  id: string;
  createdAt: number;
  name: string;
  description?: string;
  percentageChange: number;
  type: "markup" | "discount";
}

export interface InventoryAdjustment {
  id: string;
  createdAt: number;
  adjustmentNumber: string;
  itemId: string;
  itemName: string;
  date: number;
  type: "Quantity" | "Value";
  adjustedValue: number;
  reason: "Damage" | "Theft" | "Reconciliation" | "Stock Write-off";
  notes?: string;
}

export interface Project {
  id: string;
  createdAt: number;
  projectName: string;
  billingMethod: "Fixed Cost" | "Hourly Rate";
  customerId: string;
  customerName: string;
  rate?: number;
  budget?: number;
  status: "active" | "completed" | "on hold";
}

export interface Timesheet {
  id: string;
  createdAt: number;
  projectId: string;
  projectName: string;
  employeeName: string;
  date: number;
  hours: number;
  billable: boolean;
  description?: string;
}

export interface OrgSettings {
  companyName: string;
  fiscalYear: string;
  currency: string;
  taxRate: number;
  logoUrl?: string;
}
