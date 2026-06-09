import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Bills from "./pages/Bills";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import MainLayout from "./components/MainLayout";


function Router() {
  return (
    <Switch>
      <Route path="/" component={MainLayout} />
      <Route path="/dashboard" component={MainLayout} />
      <Route path="/invoices" component={MainLayout} />
      <Route path="/bills" component={MainLayout} />
      <Route path="/customers" component={MainLayout} />
      <Route path="/vendors" component={MainLayout} />
      <Route path="/reports" component={MainLayout} />
      <Route path="/documents" component={MainLayout} />
      <Route path="/quotes" component={MainLayout} />
      <Route path="/recurring-invoices" component={MainLayout} />
      <Route path="/payments-received" component={MainLayout} />
      <Route path="/sales-receipts" component={MainLayout} />
      <Route path="/credit-notes" component={MainLayout} />
      <Route path="/expenses" component={MainLayout} />
      <Route path="/purchase-orders" component={MainLayout} />
      <Route path="/payments-made" component={MainLayout} />
      <Route path="/vendor-credits" component={MainLayout} />
      <Route path="/banking" component={MainLayout} />
      <Route path="/banking/feeds" component={MainLayout} />
      <Route path="/banking/categorize" component={MainLayout} />
      <Route path="/banking/reconciliation" component={MainLayout} />
      <Route path="/accountant/journals" component={MainLayout} />
      <Route path="/accountant/coa" component={MainLayout} />
      <Route path="/accountant/budgets" component={MainLayout} />
      <Route path="/accountant/fixed-assets" component={MainLayout} />
      <Route path="/accountant/lock" component={MainLayout} />
      <Route path="/items" component={MainLayout} />
      <Route path="/items/price-lists" component={MainLayout} />
      <Route path="/items/adjustments" component={MainLayout} />
      <Route path="/projects" component={MainLayout} />
      <Route path="/projects/timesheets" component={MainLayout} />
      <Route path="/settings" component={MainLayout} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
