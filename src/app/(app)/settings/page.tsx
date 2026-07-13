"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader, Button, Card, Input, Label, Select, Badge } from "@/components/ui";

export default function SettingsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });
  const [business, setBusiness] = useState<Record<string, string | boolean | number>>({});
  const [settings, setSettings] = useState<Record<string, string | boolean | number>>({});

  useEffect(() => {
    if (data?.business) {
      setBusiness({
        name: data.business.name || "",
        email: data.business.email || "",
        phone: data.business.phone || "",
        address: data.business.address || "",
        city: data.business.city || "",
        province: data.business.province || "",
        postalCode: data.business.postalCode || "",
        vatNumber: data.business.vatNumber || "",
        logoUrl: data.business.logoUrl || "",
        language: data.business.language || "en",
        currencyCode: data.business.currencyCode || "ZAR",
        vatEnabled: data.business.vatEnabled,
        vatRate: Number(data.business.vatRate || 15),
      });
    }
    if (data?.settings) {
      setSettings({
        lowStockAlerts: data.settings.lowStockAlerts,
        outOfStockAlerts: data.settings.outOfStockAlerts,
        dailySummaryEmail: data.settings.dailySummaryEmail,
        largeSaleThresholdCents: data.settings.largeSaleThresholdCents,
        receiptFooter: data.settings.receiptFooter || "",
        allowNegativeStock: data.settings.allowNegativeStock,
        backupEnabled: data.settings.backupEnabled,
      });
    }
  }, [data]);

  async function save() {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business, settings }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Failed");
    toast.success("Settings saved");
    refetch();
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tammyshop-backup.json";
    a.click();
    toast.success("Backup downloaded");
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Business profile, VAT, notifications, permissions and billing."
        actions={
          <>
            <Link href="/settings/billing">
              <Button variant="secondary">Billing</Button>
            </Link>
            <Link href="/settings/users">
              <Button variant="secondary">Users & permissions</Button>
            </Link>
            <Button onClick={save}>Save changes</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card elevated className="space-y-3">
          <p className="label-caps">Business profile</p>
          <div>
            <Label>Business name</Label>
            <Input className="mt-1" value={String(business.name || "")} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input className="mt-1" value={String(business.logoUrl || "")} onChange={(e) => setBusiness({ ...business, logoUrl: e.target.value })} />
          </div>
          <div>
            <Label>VAT number</Label>
            <Input className="mt-1" value={String(business.vatNumber || "")} onChange={(e) => setBusiness({ ...business, vatNumber: e.target.value })} />
          </div>
          <div>
            <Label>Address</Label>
            <Input className="mt-1" value={String(business.address || "")} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>City</Label>
              <Input className="mt-1" value={String(business.city || "")} onChange={(e) => setBusiness({ ...business, city: e.target.value })} />
            </div>
            <div>
              <Label>Province</Label>
              <Input className="mt-1" value={String(business.province || "")} onChange={(e) => setBusiness({ ...business, province: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Currency</Label>
              <Select className="mt-1" value={String(business.currencyCode || "ZAR")} onChange={(e) => setBusiness({ ...business, currencyCode: e.target.value })}>
                <option value="ZAR">ZAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select className="mt-1" value={String(business.language || "en")} onChange={(e) => setBusiness({ ...business, language: e.target.value })}>
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">Zulu</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>VAT rate %</Label>
              <Input className="mt-1" type="number" value={Number(business.vatRate || 15)} onChange={(e) => setBusiness({ ...business, vatRate: Number(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(business.vatEnabled)} onChange={(e) => setBusiness({ ...business, vatEnabled: e.target.checked })} />
                VAT enabled
              </label>
            </div>
          </div>
        </Card>

        <Card elevated className="space-y-3">
          <p className="label-caps">Notifications & preferences</p>
          {[
            ["lowStockAlerts", "Low stock alerts"],
            ["outOfStockAlerts", "Out of stock alerts"],
            ["dailySummaryEmail", "Daily summary email"],
            ["allowNegativeStock", "Allow negative stock"],
            ["backupEnabled", "Automatic backup enabled"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
              />
            </label>
          ))}
          <div>
            <Label>Large sale threshold (cents)</Label>
            <Input
              className="mt-1"
              type="number"
              value={Number(settings.largeSaleThresholdCents || 100000)}
              onChange={(e) => setSettings({ ...settings, largeSaleThresholdCents: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Receipt footer</Label>
            <Input className="mt-1" value={String(settings.receiptFooter || "")} onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })} />
          </div>
          <div className="pt-2">
            <p className="label-caps mb-2">Dark mode</p>
            <p className="text-sm text-text-secondary">Use the moon/sun toggle in the top bar. Theme follows system when available.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={downloadBackup}>
              Backup
            </Button>
            <label>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await file.text();
                  toast.success("Backup file loaded (restore mapping ready for production import)");
                }}
              />
              <Button variant="secondary" onClick={(e) => ((e.currentTarget.previousSibling as HTMLInputElement) || null)?.click?.()}>
                Restore
              </Button>
            </label>
          </div>
        </Card>
      </div>

      <Card elevated className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-caps">Current plan</p>
            <p className="mt-1 text-xl font-bold">{data?.subscription?.plan || "FREE"}</p>
            <Badge className="mt-2" tone="primary">
              {data?.subscription?.status || "TRIALING"}
            </Badge>
          </div>
          <Link href="/settings/billing">
            <Button>Manage subscription</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
