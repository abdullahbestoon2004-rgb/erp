import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ModuleCard from "@/components/ModuleCard";
import ModuleDetail from "@/components/ModuleDetail";
import { searchModules } from "@/data/modules";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"sidebar" | "search">("sidebar");

  // Load last selected module from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedModule");
    if (saved) {
      setSelectedModule(saved);
    }
  }, []);

  // Save selected module to localStorage
  useEffect(() => {
    if (selectedModule) {
      localStorage.setItem("selectedModule", selectedModule);
    }
  }, [selectedModule]);

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    setViewMode("sidebar");
    setSearchQuery("");
    setSidebarOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setViewMode("search");
    } else {
      setViewMode("sidebar");
    }
  };

  const searchResults = searchQuery.trim() ? searchModules(searchQuery) : [];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onModuleSelect={handleModuleSelect}
        selectedModule={selectedModule}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex-1 max-w-md">
                <SearchBar value={searchQuery} onChange={handleSearch} />
              </div>
            </div>
            {viewMode === "search" && searchResults.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
            {viewMode === "search" ? (
              // Search Results View
              <div>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((module) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        isSelected={selectedModule === module.id}
                        onClick={() => handleModuleSelect(module.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No modules found matching "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            ) : selectedModule ? (
              // Module Detail View
              <ModuleDetail moduleId={selectedModule} />
            ) : (
              // Welcome Empty State
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h1 className="font-display font-bold text-2xl text-foreground mb-2">
                  Welcome to ABSystem Reference
                </h1>
                <p className="text-muted-foreground max-w-md mb-6">
                  Explore 16 accounting modules with 43 features. Select a module from the sidebar
                  or use the search bar to get started.
                </p>
                <Button onClick={() => handleModuleSelect("receivables")}>
                  Explore Receivables
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 md:p-6 text-center text-xs text-muted-foreground">
            <p>ABSystem Structure Reference • 16 modules • 43 features</p>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
