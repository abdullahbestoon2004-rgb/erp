import { ScrollArea } from "@/components/ui/scroll-area";
import { sidebarStructure } from "@/data/sidebarStructure";
import {
  Home,
  TrendingUp,
  CreditCard,
  Landmark,
  Package,
  Briefcase,
  Clock,
  Calculator,
  BarChart3,
  FileText,
  Receipt,
  ShoppingCart,
  CheckCircle,
  CheckSquare,
  DollarSign,
  Folder,
  Link,
  Tag,
  Box,
  AlertCircle,
  Edit,
  List,
  Scale,
  Zap,
  Settings,
  ChevronDown,
  X,
  BookOpen,
  Users,
  MessageSquare,
  Plug,
  Smartphone,
  Lock,
  Globe,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  CreditCard: <CreditCard className="h-5 w-5" />,
  Landmark: <Landmark className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Clock: <Clock className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Receipt: <Receipt className="h-5 w-5" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  CheckSquare: <CheckSquare className="h-5 w-5" />,
  DollarSign: <DollarSign className="h-5 w-5" />,
  Folder: <Folder className="h-5 w-5" />,
  Link: <Link className="h-5 w-5" />,
  Tag: <Tag className="h-5 w-5" />,
  Box: <Box className="h-5 w-5" />,
  AlertCircle: <AlertCircle className="h-5 w-5" />,
  Edit: <Edit className="h-5 w-5" />,
  List: <List className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Plug: <Plug className="h-5 w-5" />,
  Smartphone: <Smartphone className="h-5 w-5" />,
  Lock: <Lock className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onModuleSelect: (moduleId: string) => void;
  selectedModule: string | null;
}

export default function Sidebar({
  isOpen,
  onClose,
  onModuleSelect,
  selectedModule,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (id: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleSection(id);
    } else {
      onModuleSelect(id);
    }
  };

  const handleChildClick = (childId: string) => {
    onModuleSelect(childId);
  };

  const renderIcon = (iconName: string) => {
    return iconMap[iconName] || null;
  };

  const totalModules = 16;
  const totalFeatures = 43;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-sidebar-foreground">
                  ABSystem
                </div>
                <div className="text-xs text-muted-foreground">Reference</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-sidebar-accent rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {sidebarStructure.map((item) => {
              const isExpanded = expandedSections.has(item.id);
              const hasChildren = item.children && item.children.length > 0;
              const isSelected = selectedModule === item.id;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id, !!hasChildren)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-2 mt-1 space-y-1 border-l border-sidebar-border pl-2">
                      {item.children!.map((child) => {
                        const childSelected = selectedModule === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleChildClick(child.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                              childSelected
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                            }`}
                          >
                            {renderIcon(child.icon)}
                            <span className="flex-1 text-left">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground text-center">
          <div className="font-semibold text-sidebar-foreground mb-1">
            {totalModules} modules
          </div>
          <div>{totalFeatures} features</div>
        </div>
      </aside>
    </>
  );
}
