export interface SidebarChild {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: SidebarChild[];
}

export const sidebarStructure: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: "Home",
    path: "/dashboard"
  },
  {
    id: "items",
    label: "Items",
    icon: "ShoppingBag",
    children: [
      { id: "items",        label: "Items",        icon: "Box",          path: "/items" },
      { id: "price-lists",  label: "Price Lists",  icon: "Tag",          path: "/items/price-lists" }
    ]
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "Package",
    children: [
      { id: "adjustments",  label: "Adjustments",  icon: "Edit",         path: "/items/adjustments" }
    ]
  },
  {
    id: "sales",
    label: "Sales",
    icon: "ShoppingCart",
    children: [
      { id: "customers",          label: "Customers",          icon: "Users",        path: "/customers" },
      { id: "quotes",             label: "Quotes",             icon: "FileText",     path: "/quotes" },
      { id: "invoices",           label: "Invoices",           icon: "Receipt",      path: "/invoices" },
      { id: "recurring-invoices", label: "Recurring Invoices", icon: "RefreshCw",    path: "/recurring-invoices" },
      { id: "payments-received",  label: "Payments Received",  icon: "CheckCircle",  path: "/payments-received" },
      { id: "sales-receipts",     label: "Sales Receipts",     icon: "FileCheck",    path: "/sales-receipts" },
      { id: "credit-notes",       label: "Credit Notes",       icon: "FileMinus",    path: "/credit-notes" }
    ]
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: "ShoppingBag",
    children: [
      { id: "vendors",          label: "Vendors",          icon: "Building2",    path: "/vendors" },
      { id: "expenses",         label: "Expenses",         icon: "DollarSign",   path: "/expenses" },
      { id: "purchase-orders",  label: "Purchase Orders",  icon: "ClipboardList",path: "/purchase-orders" },
      { id: "bills",            label: "Bills",            icon: "FileText",     path: "/bills" },
      { id: "payments-made",    label: "Payments Made",    icon: "CreditCard",   path: "/payments-made" },
      { id: "vendor-credits",   label: "Vendor Credits",   icon: "FilePlus",     path: "/vendor-credits" }
    ]
  },
  {
    id: "time-tracking",
    label: "Time Tracking",
    icon: "Clock",
    children: [
      { id: "projects",     label: "Projects",     icon: "Folder",    path: "/projects" },
      { id: "timesheets",   label: "Timesheets",   icon: "Clock",     path: "/projects/timesheets" }
    ]
  },
  {
    id: "banking",
    label: "Banking",
    icon: "Landmark",
    children: [
      { id: "bank-accounts",   label: "Bank Accounts",            icon: "CreditCard",  path: "/banking" },
      { id: "bank-feeds",      label: "Bank Feeds",               icon: "Rss",         path: "/banking/feeds" },
      { id: "categorize",      label: "Match & Categorize",       icon: "Tag",         path: "/banking/categorize" },
      { id: "reconciliation",  label: "Reconciliation",           icon: "CheckSquare", path: "/banking/reconciliation" }
    ]
  },
  {
    id: "accountant",
    label: "Accountant",
    icon: "Calculator",
    children: [
      { id: "manual-journals",   label: "Manual Journals",    icon: "BookOpen",   path: "/accountant/journals" },
      { id: "chart-of-accounts", label: "Chart of Accounts",  icon: "List",       path: "/accountant/coa" },
      { id: "budgets",           label: "Budgets",             icon: "BarChart2",  path: "/accountant/budgets" },
      { id: "fixed-assets",      label: "Fixed Assets",        icon: "Box",        path: "/accountant/fixed-assets" },
      { id: "transaction-lock",  label: "Transaction Locking", icon: "Lock",       path: "/accountant/lock" }
    ]
  },
  {
    id: "reports",
    label: "Reports",
    icon: "BarChart3",
    path: "/reports"
  },
  {
    id: "documents",
    label: "Documents",
    icon: "Folder",
    path: "/documents"
  }
];
