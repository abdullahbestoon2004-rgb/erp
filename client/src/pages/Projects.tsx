import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Folder, Clock, Plus, Trash2, Milestone, Timer } from "lucide-react";
import { Project, Timesheet } from "@/types";
import { projectStorage, timesheetStorage, customerStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Projects() {
  const [location, navigate] = useLocation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Project Form States
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [billingMethod, setBillingMethod] = useState<"Fixed Cost" | "Hourly Rate">("Hourly Rate");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rate, setRate] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "on hold">("active");

  // Timesheet Form States
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);
  const [tsProjectId, setTsProjectId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [tsDate, setTsDate] = useState(new Date().toISOString().split("T")[0]);
  const [tsHours, setTsHours] = useState("");
  const [tsBillable, setTsBillable] = useState(true);
  const [tsDesc, setTsDesc] = useState("");

  useEffect(() => {
    loadData();
    setCustomers(customerStorage.getAll());
  }, []);

  const loadData = () => {
    setProjects(projectStorage.getAll());
    setTimesheets(timesheetStorage.getAll());
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setCustomerName(customer.name);
    }
  };

  // 1. Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !customerId) {
      toast.error("Project name and customer are required");
      return;
    }

    projectStorage.add({
      projectName,
      billingMethod,
      customerId,
      customerName,
      rate: rate ? parseFloat(rate) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      status
    });

    toast.success(`Project "${projectName}" initialized!`);
    loadData();
    setIsProjectOpen(false);
    // Reset form
    setProjectName("");
    setCustomerId("");
    setCustomerName("");
    setRate("");
    setBudget("");
    setStatus("active");
  };

  // 2. Log Hours
  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tsProjectId || !employeeName || !tsHours) {
      toast.error("Please fill in project, employee name, and hours");
      return;
    }

    const matchedProject = projects.find(p => p.id === tsProjectId);
    if (!matchedProject) return;

    timesheetStorage.add({
      projectId: tsProjectId,
      projectName: matchedProject.projectName,
      employeeName,
      date: new Date(tsDate).getTime(),
      hours: parseFloat(tsHours) || 0,
      billable: tsBillable,
      description: tsDesc || undefined
    });

    toast.success(`Logged ${tsHours} hours for ${employeeName}`);
    loadData();
    setIsTimesheetOpen(false);
    setTsProjectId("");
    setEmployeeName("");
    setTsHours("");
    setTsDesc("");
  };

  const handleProjectStatusChange = (proj: Project, newStatus: "active" | "completed" | "on hold") => {
    projectStorage.update(proj.id, { status: newStatus });
    toast.success(`Status updated for project: ${proj.projectName}`);
    loadData();
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Aggregated Stats
  const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
  const billableHours = timesheets.filter(ts => ts.billable).reduce((sum, ts) => sum + ts.hours, 0);
  const nonBillableHours = totalHours - billableHours;

  const getActiveTab = () => {
    if (location === "/projects/timesheets") return "timesheets";
    return "projects";
  };

  const activeTab = getActiveTab();

  const renderTabs = () => {
    const tabs = [
      { id: "projects", label: "Projects", path: "/projects", icon: Folder },
      { id: "timesheets", label: "Timesheets (Log Hours)", path: "/projects/timesheets", icon: Clock },
    ];

    return (
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-foreground">Time Tracking & Projects</h1>
        <p className="text-muted-foreground mt-1">Track billable hours, manage project tasks, and monitor timesheets</p>
      </div>

      {renderTabs()}

      {/* PROJECTS LIST TAB */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Active Work Projects</h2>
            <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent fullScreen>
                <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
                  <DialogTitle className="text-xl font-display font-bold">Configure Project Details</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/20">
                  <div className="max-w-3xl mx-auto bg-card p-8 rounded-xl border border-border shadow-sm">
                    <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <Label>Project Name *</Label>
                    <Input placeholder="E.g., Website Redesign" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Billing Method</Label>
                      <Select value={billingMethod} onValueChange={(v: any) => setBillingMethod(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hourly Rate">Hourly Rate</SelectItem>
                          <SelectItem value="Fixed Cost">Fixed Cost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Customer *</Label>
                      <Select value={customerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rate per hour / fixed cost ($)</Label>
                      <Input type="number" placeholder="0.00" value={rate} onChange={(e) => setRate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Project Budget ($)</Label>
                      <Input type="number" placeholder="0.00" value={budget} onChange={(e) => setBudget(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Project Status</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit">Create Project</Button>
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <Card key={proj.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-lg text-foreground">{proj.projectName}</h3>
                      <Badge className={getStatusColor(proj.status)}>
                        {proj.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Client: {proj.customerName} • Billing: {proj.billingMethod}</p>
                  </div>
                  <Milestone className="h-6 w-6 text-primary/30 shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 mt-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Rate/Fee:</span>
                    <span className="font-semibold text-foreground text-sm">
                      {proj.rate ? `$${proj.rate}/${proj.billingMethod === "Hourly Rate" ? "hr" : "fixed"}` : "Unspecified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Total Budget:</span>
                    <span className="font-semibold text-foreground text-sm">
                      {proj.budget ? `$${proj.budget.toLocaleString()}` : "Unspecified"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-dashed">
                  <Select value={proj.status} onValueChange={(val: any) => handleProjectStatusChange(proj, val)}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TIMESHEETS TAB */}
      {activeTab === "timesheets" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 flex items-center justify-between bg-primary/5 border-primary/20">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Total Logged Hours</span>
                <span className="text-2xl font-bold text-primary">{totalHours} hrs</span>
              </div>
              <Timer className="h-8 w-8 text-primary/30" />
            </Card>
            <Card className="p-4 flex items-center justify-between bg-green-50 border-green-200">
              <div>
                <span className="text-xs text-green-700 block font-medium">Billable Hours</span>
                <span className="text-2xl font-bold text-green-600">{billableHours} hrs</span>
              </div>
              <Timer className="h-8 w-8 text-green-300" />
            </Card>
            <Card className="p-4 flex items-center justify-between bg-slate-50 border-slate-200">
              <div>
                <span className="text-xs text-slate-700 block font-medium">Non-Billable Hours</span>
                <span className="text-2xl font-bold text-slate-600">{nonBillableHours} hrs</span>
              </div>
              <Timer className="h-8 w-8 text-slate-300" />
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Logged Tasks Records</h2>
            <Dialog open={isTimesheetOpen} onOpenChange={setIsTimesheetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Daily Work Hours</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLogHours} className="space-y-4">
                  <div>
                    <Label>Project *</Label>
                    <Select value={tsProjectId} onValueChange={setTsProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.filter(p => p.status === "active").map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.projectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Employee Name *</Label>
                    <Input placeholder="Your full name" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Work Date</Label>
                      <Input type="date" value={tsDate} onChange={(e) => setTsDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Duration (Hours) *</Label>
                      <Input type="number" step="0.5" placeholder="E.g., 4.5" value={tsHours} onChange={(e) => setTsHours(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="tsBillable"
                      checked={tsBillable}
                      onChange={(e) => setTsBillable(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <Label htmlFor="tsBillable" className="cursor-pointer select-none">
                      Mark as Billable to Customer
                    </Label>
                  </div>
                  <div>
                    <Label>Task Details / Notes</Label>
                    <textarea
                      value={tsDesc}
                      onChange={(e) => setTsDesc(e.target.value)}
                      placeholder="What were you working on?"
                      className="w-full p-2 border border-border rounded-md text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsTimesheetOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Log Time</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-0 overflow-hidden">
            <ScrollArea className="h-[350px]">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border font-medium text-muted-foreground">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Hours</th>
                    <th className="p-3 text-center">Billable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {timesheets.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-foreground">{ts.employeeName}</td>
                      <td className="p-3 text-muted-foreground">{ts.projectName}</td>
                      <td className="p-3 text-muted-foreground">{new Date(ts.date).toLocaleDateString()}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{ts.hours} hrs</td>
                      <td className="p-3 text-center">
                        <Badge className={ts.billable ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                          {ts.billable ? "Yes" : "No"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}
