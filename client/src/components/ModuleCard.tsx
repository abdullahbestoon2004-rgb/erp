import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Module } from "@/data/modules";
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
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
  CreditCard: <CreditCard className="h-6 w-6" />,
  Landmark: <Landmark className="h-6 w-6" />,
  Package: <Package className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  Clock: <Clock className="h-6 w-6" />,
  Calculator: <Calculator className="h-6 w-6" />,
  BarChart3: <BarChart3 className="h-6 w-6" />,
  FileText: <FileText className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  MessageSquare: <MessageSquare className="h-6 w-6" />,
  Plug: <Plug className="h-6 w-6" />,
  Smartphone: <Smartphone className="h-6 w-6" />,
  Lock: <Lock className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
};

interface ModuleCardProps {
  module: Module;
  isSelected: boolean;
  onClick: () => void;
}

export default function ModuleCard({
  module,
  isSelected,
  onClick,
}: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderIcon = (iconName: string) => {
    return iconMap[iconName] || null;
  };

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary shadow-lg"
          : "hover:shadow-md hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-primary mt-1">{renderIcon(module.icon)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-foreground">
            {module.name}
          </h3>
          <Badge variant="secondary" className="text-xs mt-1">
            {module.category}
          </Badge>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {module.description}
      </p>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in">
          {module.features.map((feature) => (
            <div key={feature.id} className="text-xs">
              <p className="font-semibold text-foreground">{feature.name}</p>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
