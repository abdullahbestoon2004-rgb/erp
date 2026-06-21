import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import SearchBar from "./SearchBar";
import { useTheme } from "@/contexts/ThemeContext";
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
  Bell,
  Settings2,
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
  Sun,
  Moon,
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
  const { theme, toggleTheme, switchable } = useTheme();

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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static left-0 top-0 h-screen w-[248px] bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="h-[18px] w-[18px] text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[13.5px] text-sidebar-foreground tracking-tight truncate">
                ABSystem
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <span>My Org</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3">
          <nav className="px-2 space-y-0.5">
            {sidebarStructure.map((item) => {
              if (item.path && !item.children) {
                const isActive = location === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.path!)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-[13px] font-normal transition-all duration-150 ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                    }`}
                  >
                    <span className="w-3.5 mr-2 shrink-0" />
                    <span className={`mr-2.5 flex items-center justify-center shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {renderIcon(item.icon, "h-[17px] w-[17px]")}
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
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-[13px] font-normal transition-all duration-150 ${
                      anyChildActive
                        ? "bg-primary/6 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                    }`}
                  >
                    <span className="w-3.5 flex items-center justify-center shrink-0 mr-2 text-muted-foreground">
                      {isExp ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </span>
                    <span className={`mr-2.5 flex items-center justify-center shrink-0 ${anyChildActive ? "text-primary" : "text-muted-foreground"}`}>
                      {renderIcon(item.icon, "h-[17px] w-[17px]")}
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
                            className={`w-full flex items-center pl-[3.75rem] pr-3 py-1.5 rounded-xl text-[12.5px] font-normal transition-all duration-150 ${
                              isChildActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
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
        <div className="px-3 py-3 border-t border-sidebar-border space-y-1 flex-shrink-0">
          <button
            onClick={() => alert("Configure Features coming soon!")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-medium text-primary bg-primary/8 hover:bg-primary/12 transition-all duration-150"
          >
            <span>Configure Features</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </button>

          <button
            onClick={() => alert("Help & Support coming soon!")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-150"
          >
            <HelpCircle className="h-[15px] w-[15px] text-muted-foreground shrink-0" />
            <span>Help & Support</span>
          </button>

          {switchable && toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-150"
            >
              {theme === "dark"
                ? <Sun  className="h-[15px] w-[15px] text-muted-foreground shrink-0" />
                : <Moon className="h-[15px] w-[15px] text-muted-foreground shrink-0" />}
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
          )}

          <button
            onClick={() => {
              navigate("/settings");
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-normal transition-all duration-150 ${
              location === "/settings"
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
            }`}
          >
            <SettingsIcon className={`h-[15px] w-[15px] shrink-0 ${location === "/settings" ? "text-primary" : "text-muted-foreground"}`} />
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
  const [, navigate] = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border/60 bg-background/95 backdrop-blur-xl px-5 py-2.5 flex items-center justify-between gap-4 shrink-0">
          {/* Left — hamburger + search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Right — notifications + settings + user avatar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Notification bell */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" title="Notifications">
              <Bell className="h-4.5 w-4.5" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
              onClick={() => { navigate("/settings"); }}
              title="Settings">
              <Settings2 className="h-4.5 w-4.5" />
            </Button>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* User avatar */}
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2.5 pl-1 rounded-lg hover:bg-muted/60 transition-colors px-2 py-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-primary-foreground leading-none">AB</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-foreground leading-none">Abdulla</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Admin</p>
              </div>
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
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
