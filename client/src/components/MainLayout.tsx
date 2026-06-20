import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import SearchBar from "./SearchBar";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import Bills from "@/pages/Bills";
import Customers from "@/pages/Customers";
import Vendors from "@/pages/Vendors";
import Quotes from "@/pages/Quotes";
import RecurringInvoices from "@/pages/RecurringInvoices";
import PaymentsReceived from "@/pages/PaymentsReceived";
import SalesReceipts from "@/pages/SalesReceipts";
import CreditNotes from "@/pages/CreditNotes";
import Expenses from "@/pages/Expenses";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PaymentsMade from "@/pages/PaymentsMade";
import VendorCredits from "@/pages/VendorCredits";
import Banking from "@/pages/Banking";
import Accountant from "@/pages/Accountant";
import Inventory from "@/pages/Inventory";
import Projects from "@/pages/Projects";
import Reports from "@/pages/Reports";
import Documents from "@/pages/Documents";
import Settings from "@/pages/Settings";
import { Button } from "@/components/ui/button";
import { sidebarStructure } from "@/data/sidebarStructure";
import {
  Menu,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  Users,
  FileText,
  Receipt,
  RefreshCw,
  CheckCircle,
  FileCheck,
  FileMinus,
  ShoppingCart,
  Building2,
  DollarSign,
  ClipboardList,
  CreditCard,
  FilePlus,
  Landmark,
  Rss,
  Tag,
  CheckSquare,
  Calculator,
  List,
  BarChart2,
  Box,
  Lock,
  Package,
  Edit,
  Briefcase,
  Folder,
  Clock,
  FileArchive,
  HelpCircle,
  Settings as SettingsIcon,
  Home as HomeIcon,
  ShoppingBag,
  BarChart3,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Home: HomeIcon,
  ShoppingBag,
  Package,
  ShoppingCart,
  Clock,
  Landmark,
  Calculator,
  Folder,
  BarChart3,
};

const renderIcon = (iconName: string, className: string = "h-4 w-4 shrink-0") => {
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent className={className} /> : null;
};

// Placeholder page component (reusable)
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <h1 className="text-3xl font-display font-bold mb-2 text-foreground">{title}</h1>
      <p className="text-muted-foreground mb-6">This module is coming soon.</p>
      <Button variant="outline" onClick={() => window.history.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>
    </div>
  );
}

function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [location, navigate] = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static left-0 top-0 h-screen w-[240px] bg-[#f6f8fa] border-r border-[#e2e8f0] z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between cursor-pointer hover:bg-[#eef2fc]/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-[#3c4858] truncate">
                ABSystem
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span>My Org</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="lg:hidden p-1.5 hover:bg-[#eef2fc]/30 rounded-md"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <nav className="p-2 space-y-1">
            {sidebarStructure.map((item) => {
              if (item.path && !item.children) {
                const isActive = location === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.path!)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-[13.5px] font-normal transition-colors ${
                      isActive
                        ? "bg-[#eef2fc] text-[#0052cc] font-medium"
                        : "text-[#3c4858] hover:bg-[#eef2fc]/30"
                    }`}
                  >
                    <span className="w-3.5 mr-2 shrink-0" /> {/* Align with chevron spacing */}
                    <span className="mr-3 flex items-center justify-center shrink-0 text-slate-500">
                      {renderIcon(item.icon, "h-[18px] w-[18px]")}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              }

              const isExp = expanded.has(item.id);
              const anyChildActive = item.children?.some((c) => location === c.path);

              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    onClick={() => toggle(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-[13.5px] font-normal transition-colors ${
                      anyChildActive
                        ? "bg-[#eef2fc]/45 text-[#0052cc]"
                        : "text-[#3c4858] hover:bg-[#eef2fc]/30"
                    }`}
                  >
                    <span className="w-3.5 flex items-center justify-center shrink-0 mr-2 text-slate-400">
                      {isExp ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </span>
                    <span className={`mr-3 flex items-center justify-center shrink-0 ${anyChildActive ? "text-[#0052cc]" : "text-slate-500"}`}>
                      {renderIcon(item.icon, "h-[18px] w-[18px]")}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                  {isExp && item.children && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive = location === child.path;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNav(child.path)}
                            className={`w-full flex items-center pl-16 pr-3 py-1.5 rounded-md text-[13px] font-normal transition-colors ${
                              isChildActive
                                ? "bg-[#eef2fc] text-[#0052cc] font-medium"
                                : "text-[#4a5568] hover:bg-[#eef2fc]/30 hover:text-sidebar-foreground"
                            }`}
                          >
                            <span className="flex-1 text-left truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e2e8f0] space-y-1.5 flex-shrink-0 bg-[#f6f8fa]">
          <button
            onClick={() => alert("Configure Features coming soon!")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium text-[#0052cc] bg-[#eef2fc]/60 hover:bg-[#eef2fc]/80 transition-colors"
          >
            <span>Configure Features</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => alert("Help & Support coming soon!")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-normal text-[#3c4858] hover:bg-[#eef2fc]/30 transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-slate-500" />
            <span>Help & Support</span>
          </button>
          <button
            onClick={() => {
              navigate("/settings");
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-normal transition-colors ${
              location === "/settings"
                ? "bg-[#eef2fc] text-[#0052cc] font-medium"
                : "text-[#3c4858] hover:bg-[#eef2fc]/30"
            }`}
          >
            <SettingsIcon className="h-4 w-4 text-slate-500" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-[#e2e8f0] bg-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/invoices" component={Invoices} />
              <Route path="/bills" component={Bills} />
              <Route path="/customers" component={Customers} />
              <Route path="/vendors" component={Vendors} />
              <Route path="/reports" component={Reports} />
              <Route path="/documents" component={Documents} />
              <Route path="/quotes" component={Quotes} />
              <Route path="/recurring-invoices" component={RecurringInvoices} />
              <Route path="/payments-received" component={PaymentsReceived} />
              <Route path="/sales-receipts" component={SalesReceipts} />
              <Route path="/credit-notes" component={CreditNotes} />
              <Route path="/expenses" component={Expenses} />
              <Route path="/purchase-orders" component={PurchaseOrders} />
              <Route path="/payments-made" component={PaymentsMade} />
              <Route path="/vendor-credits" component={VendorCredits} />
              <Route path="/banking" component={Banking} />
              <Route path="/banking/feeds" component={Banking} />
              <Route path="/banking/categorize" component={Banking} />
              <Route path="/banking/reconciliation" component={Banking} />
              <Route path="/accountant/journals" component={Accountant} />
              <Route path="/accountant/coa" component={Accountant} />
              <Route path="/accountant/budgets" component={Accountant} />
              <Route path="/accountant/fixed-assets" component={Accountant} />
              <Route path="/accountant/lock" component={Accountant} />
              <Route path="/items" component={Inventory} />
              <Route path="/items/price-lists" component={Inventory} />
              <Route path="/items/adjustments" component={Inventory} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/timesheets" component={Projects} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
}
