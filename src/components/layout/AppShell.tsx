"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  UserCircle,
  BarChart3,
  ClipboardList,
  FileText,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ArrowLeftRight,
  Sparkles,
  LogOut,
  ChevronRight,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Badge, Input } from "@/components/ui";
import type { SessionPayload } from "@/types";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory/products", label: "Inventory", icon: Package },
  { href: "/inventory/scan-stock", label: "Scan Stock In", icon: Camera },
  { href: "/sales", label: "Sales / POS", icon: ShoppingCart },
  { href: "/purchases", label: "Purchases", icon: Truck },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/customers", label: "Customers", icon: UserCircle },
  { href: "/stock-movements", label: "Stock Movements", icon: ArrowLeftRight },
  { href: "/analytics", label: "AI Analytics", icon: Sparkles },
  { href: "/shopping-list", label: "Shopping List", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
  unreadNotifications = 0,
}: {
  children: React.ReactNode;
  user: SessionPayload;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { type: string; id: string; title: string; subtitle?: string; href: string }[]
  >([]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const active = useMemo(
    () => nav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`)),
    [pathname]
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh bg-bg text-text">
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-border/70 bg-white/80 p-4 backdrop-blur-xl transition-transform dark:bg-surface/90 dark:border-white/10 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between px-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white font-bold shadow-sm">
                T
              </div>
              <div>
                <p className="text-lg font-bold leading-none">TammyShop</p>
                <p className="text-[11px] text-text-muted">Simple. Smart. Stock Control.</p>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto pb-24">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:bg-bg hover:text-text dark:hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {open ? <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} /> : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-white/75 px-4 py-3 backdrop-blur-xl dark:bg-surface/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button className="rounded-xl p-2 hover:bg-bg lg:hidden dark:hover:bg-white/5" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden md:block">
                <p className="text-sm font-semibold">{active?.label ?? "TammyShop"}</p>
                <p className="text-xs text-text-muted">
                  {user.fullName} · {user.role.toLowerCase()}
                </p>
              </div>
              <div className="relative ml-auto flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    className="w-64 pl-9"
                    placeholder="Search everything..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                  />
                  <AnimatePresence>
                    {searchOpen && results.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-2xl border border-border bg-white shadow-elevated dark:bg-surface dark:border-white/10"
                      >
                        {results.map((r) => (
                          <Link
                            key={`${r.type}-${r.id}`}
                            href={r.href}
                            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg dark:hover:bg-white/5"
                            onClick={() => {
                              setSearchOpen(false);
                              setQuery("");
                            }}
                          >
                            <div>
                              <p className="text-sm font-medium">{r.title}</p>
                              <p className="text-xs text-text-muted">
                                {r.type}
                                {r.subtitle ? ` · ${r.subtitle}` : ""}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-text-muted" />
                          </Link>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <Link href="/notifications" className="relative rounded-xl p-2 hover:bg-bg dark:hover:bg-white/5">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 ? (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] text-white">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Badge tone="primary">{user.role}</Badge>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </main>

          {!pathname.startsWith("/inventory/scan-stock") ? (
            <Link
              href="/inventory/scan-stock"
              className="fixed bottom-5 right-5 z-30 flex h-14 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-white shadow-elevated lg:bottom-8 lg:right-8"
              aria-label="Scan barcode to add stock"
            >
              <Camera className="h-5 w-5" />
              <span className="hidden sm:inline">Scan stock</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
