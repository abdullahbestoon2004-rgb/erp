import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Save, Building, ShieldAlert } from "lucide-react";
import { OrgSettings } from "@/types";
import { orgSettingsStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function Settings() {
  const [companyName, setCompanyName] = useState("");
  const [fiscalYear, setFiscalYear] = useState("January-December");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState("8.25");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const s = orgSettingsStorage.get();
    setCompanyName(s.companyName);
    setFiscalYear(s.fiscalYear);
    setCurrency(s.currency);
    setTaxRate(s.taxRate.toString());
    setLogoUrl(s.logoUrl || "");
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !taxRate) {
      toast.error("Required fields cannot be empty");
      return;
    }

    orgSettingsStorage.set({
      companyName,
      fiscalYear,
      currency,
      taxRate: parseFloat(taxRate) || 0,
      logoUrl: logoUrl || undefined,
    });

    toast.success("Organization profile and settings updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-3xl text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure company profiles, fiscal calendars, base tax structures & system defaults</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="font-bold text-lg text-foreground">Organization Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company / Organization Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="E.g., Acme Corporation LLC"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fiscalYear">Fiscal Year Cycle</Label>
                <Select value={fiscalYear} onValueChange={setFiscalYear}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="January-December">January - December</SelectItem>
                    <SelectItem value="April-March">April - March</SelectItem>
                    <SelectItem value="July-June">July - June</SelectItem>
                    <SelectItem value="October-September">October - September</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Base Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                    <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD ($) - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Standard Sales Tax Rate (%) *</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="8.25"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">Company Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 border border-dashed border-slate-200 bg-slate-50/50">
        <h3 className="font-bold text-sm text-foreground mb-1.5">System Audit Information</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Modifying the default tax rates or organization base currency values affects subsequent Invoice & Bill calculations. Ledger postings prior to changes will maintain historical tax entries.
        </p>
      </Card>
    </div>
  );
}
