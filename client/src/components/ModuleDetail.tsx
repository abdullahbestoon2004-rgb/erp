import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getModuleById, modules } from "@/data/modules";
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
  Users,
  MessageSquare,
  Plug,
  Smartphone,
  Lock,
  Globe,
  BookOpen,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-12 w-12" />,
  TrendingUp: <TrendingUp className="h-12 w-12" />,
  CreditCard: <CreditCard className="h-12 w-12" />,
  Landmark: <Landmark className="h-12 w-12" />,
  Package: <Package className="h-12 w-12" />,
  Briefcase: <Briefcase className="h-12 w-12" />,
  Clock: <Clock className="h-12 w-12" />,
  Calculator: <Calculator className="h-12 w-12" />,
  BarChart3: <BarChart3 className="h-12 w-12" />,
  FileText: <FileText className="h-12 w-12" />,
  Users: <Users className="h-12 w-12" />,
  MessageSquare: <MessageSquare className="h-12 w-12" />,
  Plug: <Plug className="h-12 w-12" />,
  Smartphone: <Smartphone className="h-12 w-12" />,
  Lock: <Lock className="h-12 w-12" />,
  Globe: <Globe className="h-12 w-12" />,
};

interface ModuleDetailProps {
  moduleId?: string;
}

export default function ModuleDetail({ moduleId }: ModuleDetailProps) {
  const module = moduleId ? getModuleById(moduleId) : null;

  const renderIcon = (iconName: string, size: "sm" | "lg" = "lg") => {
    const sizeClass = size === "lg" ? "h-12 w-12" : "h-6 w-6";
    if (size === "lg") {
      return iconMap[iconName] || null;
    }
    // For small icons
    const smallMap: Record<string, React.ReactNode> = {
      Home: <Home className={sizeClass} />,
      TrendingUp: <TrendingUp className={sizeClass} />,
      CreditCard: <CreditCard className={sizeClass} />,
      Landmark: <Landmark className={sizeClass} />,
      Package: <Package className={sizeClass} />,
      Briefcase: <Briefcase className={sizeClass} />,
      Clock: <Clock className={sizeClass} />,
      Calculator: <Calculator className={sizeClass} />,
      BarChart3: <BarChart3 className={sizeClass} />,
      FileText: <FileText className={sizeClass} />,
      Users: <Users className={sizeClass} />,
      MessageSquare: <MessageSquare className={sizeClass} />,
      Plug: <Plug className={sizeClass} />,
      Smartphone: <Smartphone className={sizeClass} />,
      Lock: <Lock className={sizeClass} />,
      Globe: <Globe className={sizeClass} />,
    };
    return smallMap[iconName] || null;
  };

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          Select a Module
        </h2>
        <p className="text-muted-foreground max-w-md">
          Choose a module from the sidebar or search results to view its details,
          features, and related information.
        </p>
      </div>
    );
  }

  // Get related modules (same category, excluding current)
  const relatedModules = modules
    .filter((m) => m.category === module.category && m.id !== module.id)
    .slice(0, 6);

  // If not enough related, add from other categories
  if (relatedModules.length < 6) {
    const otherModules = modules
      .filter((m) => m.category !== module.category && m.id !== module.id)
      .slice(0, 6 - relatedModules.length);
    relatedModules.push(...otherModules);
  }

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Module Header */}
      <div className="flex items-start gap-6 pb-6 border-b border-border">
        <div className="text-primary flex-shrink-0">
          {renderIcon(module.icon, "lg")}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            {module.name}
          </h1>
          <Badge variant="default" className="mb-3">
            {module.category}
          </Badge>
          <p className="text-base text-muted-foreground">{module.description}</p>
        </div>
      </div>

      {/* Features Section */}
      <div>
        <h2 className="font-display font-bold text-xl text-foreground mb-4">
          Features
        </h2>
        <div className="grid gap-3">
          {module.features.map((feature) => (
            <Card key={feature.id} className="p-4">
              <h3 className="font-display font-bold text-sm text-foreground mb-1">
                {feature.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Related Modules */}
      {relatedModules.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            Related Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedModules.map((relModule) => (
              <Card key={relModule.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-primary flex-shrink-0">
                    {renderIcon(relModule.icon, "sm")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-sm text-foreground">
                      {relModule.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {relModule.category}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {relModule.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
