export interface Feature {
  id: string;
  name: string;
  description: string;
}

export interface Module {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  features: Feature[];
}

export const modules: Module[] = [
  {
    id: "receivables",
    name: "Receivables",
    category: "Sales & Revenue",
    description: "Manage customer invoices, quotes, and payment collection with comprehensive tracking and automation.",
    icon: "TrendingUp",
    features: [
      {
        id: "quotes",
        name: "Quotes",
        description: "Create professional quotes and convert them to invoices with customizable templates and branding."
      },
      {
        id: "invoices",
        name: "Invoices",
        description: "Generate and send invoices with automatic reminders, payment tracking, and multi-currency support."
      },
      {
        id: "sales-orders",
        name: "Sales Orders",
        description: "Process sales orders with inventory tracking, fulfillment management, and order status updates."
      },
      {
        id: "payments-received",
        name: "Payments Received",
        description: "Record and reconcile customer payments with automatic bank feed matching and receipt generation."
      },
      {
        id: "sales-approvals",
        name: "Sales Approvals",
        description: "Set up approval workflows for quotes and invoices based on amount, customer, or custom rules."
      },
      {
        id: "revenue-recognition",
        name: "Revenue Recognition",
        description: "Automate revenue recognition based on ASC 606 standards with flexible scheduling and reporting."
      }
    ]
  },
  {
    id: "payables",
    name: "Payables",
    category: "Expenses & Payments",
    description: "Control vendor payments, purchase orders, and expense management with approval workflows.",
    icon: "CreditCard",
    features: [
      {
        id: "vendor-bills",
        name: "Vendor Bills",
        description: "Create and manage vendor bills with automatic matching to purchase orders and receipt tracking."
      },
      {
        id: "purchase-orders",
        name: "Purchase Orders",
        description: "Generate purchase orders with vendor management, approval workflows, and inventory integration."
      },
      {
        id: "expenses",
        name: "Expenses",
        description: "Track employee expenses with receipt capture, approval routing, and reimbursement processing."
      },
      {
        id: "documents",
        name: "Documents",
        description: "Store and organize vendor documents, contracts, and supporting files with secure access control."
      },
      {
        id: "billpay",
        name: "BillPay",
        description: "Schedule and process vendor payments with bank integration, ACH support, and payment tracking."
      },
      {
        id: "purchase-approvals",
        name: "Purchase Approvals",
        description: "Configure multi-level approval workflows for purchase orders and bills based on custom rules."
      }
    ]
  },
  {
    id: "tax-compliance",
    name: "Tax Compliance",
    category: "Compliance & Reporting",
    description: "Manage tax obligations and regulatory compliance with automated calculations and filing support.",
    icon: "FileText",
    features: [
      {
        id: "sales-tax",
        name: "Sales Tax",
        description: "Calculate, track, and file sales tax with multi-jurisdiction support and automated compliance."
      },
      {
        id: "form-1099",
        name: "Form 1099 & W-9 Management",
        description: "Manage vendor W-9 forms and generate 1099 reports with automatic filing integration."
      }
    ]
  },
  {
    id: "banking",
    name: "Banking",
    category: "Cash Management",
    description: "Reconcile bank accounts, categorize transactions, and manage cash flow with real-time feeds.",
    icon: "Landmark",
    features: [
      {
        id: "bank-feeds",
        name: "Bank Feeds",
        description: "Import transactions directly from your bank with real-time updates and multi-account support."
      },
      {
        id: "categorization",
        name: "Transaction Categorization & Matching",
        description: "Automatically categorize transactions and match them to invoices and bills with AI assistance."
      },
      {
        id: "reconciliation",
        name: "Reconciliation",
        description: "Reconcile bank accounts with one-click matching and variance investigation tools."
      }
    ]
  },
  {
    id: "inventory",
    name: "Inventory",
    category: "Stock Management",
    description: "Track inventory levels, manage stock movements, and optimize inventory with advanced controls.",
    icon: "Package",
    features: [
      {
        id: "item-management",
        name: "Item Management",
        description: "Create and manage inventory items with SKUs, barcodes, and multi-unit tracking."
      },
      {
        id: "price-lists",
        name: "Price Lists",
        description: "Set up tiered pricing, customer-specific pricing, and automated price adjustments."
      },
      {
        id: "restocking",
        name: "Proactive Restocking",
        description: "Set reorder points and receive alerts for low-stock items with automated purchase order generation."
      },
      {
        id: "adjustments",
        name: "Inventory Adjustments",
        description: "Record inventory write-offs, damage, and adjustments with audit trails and approval workflows."
      },
      {
        id: "advanced-control",
        name: "Advanced Inventory Control",
        description: "Manage lot tracking, serial numbers, and expiration dates with FIFO/LIFO valuation methods."
      },
      {
        id: "ecommerce-integration",
        name: "eCommerce Integration",
        description: "Sync inventory with eCommerce platforms and manage multi-channel stock levels."
      }
    ]
  },
  {
    id: "projects",
    name: "Projects",
    category: "Project Management",
    description: "Track project profitability, budgets, timesheets, and billing with comprehensive project controls.",
    icon: "Briefcase",
    features: [
      {
        id: "budgeting",
        name: "Project Budgeting",
        description: "Set project budgets, track costs against budget, and receive variance alerts."
      },
      {
        id: "timesheets",
        name: "Project Timesheet & Approval",
        description: "Capture employee time by project with approval workflows and billable rate tracking."
      },
      {
        id: "billing",
        name: "Project Billing & Expenses",
        description: "Bill customers for project time and expenses with flexible billing arrangements."
      },
      {
        id: "profitability",
        name: "Project Profitability",
        description: "Analyze project profitability with real-time metrics and variance analysis."
      }
    ]
  },
  {
    id: "payroll",
    name: "Payroll",
    category: "Human Resources",
    description: "Process payroll, manage employee records, and handle tax withholding with compliance.",
    icon: "Users",
    features: [
      {
        id: "payroll-processing",
        name: "Integrated Payroll Processing",
        description: "Process payroll with automatic tax calculations, direct deposit, and compliance reporting."
      }
    ]
  },
  {
    id: "reports",
    name: "Reports",
    category: "Analytics & Insights",
    description: "Access 70+ built-in reports and create custom reports for business insights and analysis.",
    icon: "BarChart3",
    features: [
      {
        id: "builtin-reports",
        name: "70+ Built-in Reports",
        description: "Access comprehensive reports including P&L, balance sheet, cash flow, and custom financial statements."
      },
      {
        id: "advanced-analytics",
        name: "Advanced Analytics",
        description: "Create custom reports with drag-and-drop builder and schedule automated report delivery."
      }
    ]
  },
  {
    id: "collaboration",
    name: "Collaboration",
    category: "Communication",
    description: "Enable customer self-service and communication through a dedicated customer portal.",
    icon: "MessageSquare",
    features: [
      {
        id: "customer-portal",
        name: "Customer Portal",
        description: "Provide customers with access to invoices, payments, and account information securely."
      }
    ]
  },
  {
    id: "accountant",
    name: "Accountant",
    category: "Accounting Tools",
    description: "Advanced accounting features for journal entries, account management, and financial control.",
    icon: "Calculator",
    features: [
      {
        id: "accountant-module",
        name: "Accountant Module",
        description: "Create manual and recurring journal entries, manage chart of accounts, adjust base currency, and lock transactions for audit control."
      }
    ]
  },
  {
    id: "workflow-automation",
    name: "Workflow Automation",
    category: "Automation",
    description: "Automate business processes with custom workflows and conditional logic.",
    icon: "Zap",
    features: [
      {
        id: "custom-workflows",
        name: "Custom Workflows",
        description: "Create automated workflows with triggers, conditions, and actions for business process automation."
      }
    ]
  },
  {
    id: "customization",
    name: "Customization",
    category: "Configuration",
    description: "Customize the application with custom fields, templates, and branding options.",
    icon: "Settings",
    features: [
      {
        id: "custom-fields",
        name: "Custom Fields",
        description: "Add custom fields to transactions, customers, and vendors for your specific needs."
      },
      {
        id: "custom-templates",
        name: "Custom Templates",
        description: "Design custom invoice, quote, and report templates with your branding and layout."
      }
    ]
  },
  {
    id: "global-scale",
    name: "Global Scale",
    category: "International",
    description: "Support multi-currency, multi-language, and international compliance requirements.",
    icon: "Globe",
    features: [
      {
        id: "multi-currency",
        name: "Multi-currency & Multilingual Support",
        description: "Operate in multiple currencies with automatic exchange rates and multi-language interface support."
      },
      {
        id: "multiple-editions",
        name: "Multiple Editions",
        description: "Choose from multiple editions tailored to different business sizes and industries."
      }
    ]
  },
  {
    id: "integrations",
    name: "Integrations",
    category: "Ecosystem",
    description: "Connect with third-party applications and payment gateways for extended functionality.",
    icon: "Plug",
    features: [
      {
        id: "third-party-apps",
        name: "Third-party Apps",
        description: "Integrate with popular business applications like CRM, HR, and productivity tools."
      },
      {
        id: "zoho-apps",
        name: "Zoho Apps",
        description: "Connect seamlessly with other Zoho applications for unified business management."
      },
      {
        id: "payment-gateways",
        name: "Payment Gateways",
        description: "Accept payments through multiple payment gateways with automatic reconciliation."
      }
    ]
  },
  {
    id: "devices",
    name: "Devices",
    category: "Accessibility",
    description: "Access your accounting system from any device with native mobile and desktop applications.",
    icon: "Smartphone",
    features: [
      {
        id: "mobile-desktop",
        name: "Mobile & Desktop Apps",
        description: "Use native iOS, Android, and desktop applications to manage accounting on the go."
      }
    ]
  },
  {
    id: "security",
    name: "Security",
    category: "Protection",
    description: "Protect your financial data with enterprise-grade security and access controls.",
    icon: "Lock",
    features: [
      {
        id: "data-security",
        name: "Data Security",
        description: "Bank-level encryption, regular backups, and compliance with SOC 2 and ISO 27001 standards."
      },
      {
        id: "user-access-control",
        name: "User Access Control",
        description: "Set granular permissions, role-based access, and audit trails for all user activities."
      }
    ]
  }
];

export const categories = Array.from(new Set(modules.map(m => m.category)));

export function getModuleById(id: string): Module | undefined {
  return modules.find(m => m.id === id);
}

export function searchModules(query: string): Module[] {
  const lowerQuery = query.toLowerCase();
  return modules.filter(module => {
    // Search in module name and description
    if (module.name.toLowerCase().includes(lowerQuery) || 
        module.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    // Search in feature names and descriptions
    return module.features.some(feature =>
      feature.name.toLowerCase().includes(lowerQuery) ||
      feature.description.toLowerCase().includes(lowerQuery)
    );
  });
}
