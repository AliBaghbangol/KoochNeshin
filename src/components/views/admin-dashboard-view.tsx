"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Mountain,
  Store,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Check,
  ChevronLeft,
  Settings,
  AlertCircle,
  Crown,
  Search,
} from "lucide-react";
import { useAuth } from "@/store/auth-store";
import { useLeaderVerification } from "@/store/leader-verification-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useDraftTours } from "@/store/draft-tours-store";
import { useDraftProducts } from "@/store/draft-products-store";
import { useLeaderBookings } from "@/store/leader-bookings-store";
import { useSellerOrders } from "@/store/seller-orders-store";
import { useBookings } from "@/store/bookings-store";
import { useOrders } from "@/store/orders-store";
import { tours as mockTours } from "@/mocks/tours";
import { equipment as mockEquipment } from "@/mocks/equipment";
import { leaders } from "@/mocks/leaders";
import {
  toFa,
  formatCurrency,
  toPersianShortDate,
} from "@/lib/format";
import {
  buildMonthlyTrend,
  trendGrowthPercent,
  type MonthlyTrendPoint,
} from "@/lib/trend";
import { getLeaderTier } from "@/lib/leader-tiers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";
import { SmartImage } from "@/components/common/smart-image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

type TabKey =
  | "overview"
  | "tours"
  | "equipment"
  | "leaders"
  | "sellers"
  | "users"
  | "bookings"
  | "settings";

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof Shield }[] = [
  { key: "overview", label: "داشبورد", icon: Shield },
  { key: "tours", label: "تورها", icon: Mountain },
  { key: "equipment", label: "تجهیزات", icon: Package },
  { key: "leaders", label: "لیدرها", icon: Crown },
  { key: "sellers", label: "فروشندگان", icon: Store },
  { key: "users", label: "کاربران", icon: Users },
  { key: "bookings", label: "تراکنش‌ها", icon: DollarSign },
  { key: "settings", label: "تنظیمات", icon: Settings },
];

export function AdminDashboardView() {
  const { isAuthenticated, role, user } = useAuth();
  const go = useGo();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const [tab, setTab] = React.useState<TabKey>("overview");

  // Prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background pt-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "admin") {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-background pt-24 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gold/10 text-gold">
            <Shield className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold">پنل مدیریت</h2>
          <p className="mt-2 text-muted-foreground">
            برای دسترسی به پنل مدیریت، ابتدا به عنوان مدیر وارد شو.
          </p>
          <Button
            onClick={() => setAuthOpen(true)}
            className="mt-6 bg-gold text-forest"
          >
            ورود به عنوان مدیر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Breadcrumb */}
        <ScrollReveal y={10} className="mb-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <button onClick={() => go("home")} className="transition hover:text-primary">
              خانه
            </button>
            <ChevronLeft className="h-3 w-3" />
            <span className="font-bold text-foreground">پنل مدیریت</span>
          </nav>
        </ScrollReveal>

        {/* Header */}
        <ScrollReveal y={12} className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold to-sunset text-forest shadow-lg shadow-gold/20">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold md:text-3xl">
                  سلام، {user?.fullName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  پنل مدیریت کل پلتفرم کوچ‌نشین
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm font-bold text-gold">
              <Crown className="h-4 w-4" />
              دسترسی کامل
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal y={14} className="mb-6">
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-secondary/60 p-1.5 scrollbar-hide">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                    active
                      ? "bg-background text-gold shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "overview" && <OverviewTab />}
            {tab === "tours" && <ToursTab />}
            {tab === "equipment" && <EquipmentTab />}
            {tab === "leaders" && <LeadersTab />}
            {tab === "sellers" && <SellersTab />}
            {tab === "users" && <UsersTab />}
            {tab === "bookings" && <BookingsTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Overview Tab ---

/** تولتیپ RTL مشترک برای نمودار درآمد ادمین (برچسب ماه + مبلغ + تراکنش‌ها). */
function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: MonthlyTrendPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    // نمودار در ظرف dir="ltr" رندر می‌شود؛ بدون rtl متن فارسی برعکس خوانده می‌شد.
    <div dir="rtl" className="glass rounded-xl border border-border/60 px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-foreground">{p.label}</div>
      <div className="mt-1 font-bold text-emerald">{formatCurrency(p.revenue)}</div>
      <div className="text-[10px] text-muted-foreground">{toFa(p.count)} تراکنش</div>
      {p.isBest && (
        <div className="mt-0.5 text-[10px] font-bold text-gold">★ بهترین ماه</div>
      )}
    </div>
  );
}

function OverviewTab() {
  const draftTours = useDraftTours((s) => s.tours);
  const draftProducts = useDraftProducts((s) => s.products);
  const leaderBookings = useLeaderBookings((s) => s.bookings);
  const sellerOrders = useSellerOrders((s) => s.orders);

  const totalTours = mockTours.length + draftTours.filter((t) => t.status === "active").length;
  const totalEquipment = mockEquipment.length + draftProducts.length;
  const totalLeaders = leaders.length;
  const totalRevenue =
    leaderBookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0) +
    sellerOrders.filter((o) => o.status === "confirmed").reduce((s, o) => s + o.total, 0);
  const totalTransactions = leaderBookings.length + sellerOrders.length;

  // نمودار داده‌محور ۱۲ ماهه — مقیاس از درآمد واقعی تأییدشده (v25).
  const trend = React.useMemo(
    () => buildMonthlyTrend(totalRevenue, totalTransactions, "admin-platform-revenue", 12),
    [totalRevenue, totalTransactions]
  );
  const growth = trendGrowthPercent(trend);
  const avgRevenue = Math.round(trend.reduce((s, p) => s + p.revenue, 0) / trend.length);
  const bestMonth = trend.find((p) => p.isBest);
  const currentMonth = trend[trend.length - 1];

  const stats = [
    {
      label: "درآمد کل پلتفرم",
      value: totalRevenue,
      format: (v: number) => formatCurrency(v),
      icon: DollarSign,
      color: "text-emerald",
      bg: "bg-emerald/10",
      trend: `${growth >= 0 ? "+" : ""}${toFa(growth)}٪ ماه جاری`,
      trendUp: growth >= 0,
    },
    {
      label: "تورهای فعال",
      value: totalTours,
      format: (v: number) => toFa(v),
      icon: Mountain,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: `${toFa(draftTours.filter((t) => t.status === "active").length)} تور لیدرها`,
      trendUp: true,
    },
    {
      label: "تجهیزات",
      value: totalEquipment,
      format: (v: number) => toFa(v),
      icon: Package,
      color: "text-accent",
      bg: "bg-accent/10",
      trend: `${toFa(draftProducts.length)} محصول فروشندگان`,
      trendUp: true,
    },
    {
      label: "لیدرهای تأییدشده",
      value: totalLeaders,
      format: (v: number) => toFa(v),
      icon: Crown,
      color: "text-gold",
      bg: "bg-gold/10",
      trend: `میانگین ماهانه ${formatCurrency(avgRevenue)}`,
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border bg-card p-5 max-sm:p-4"
            >
              {/* خط رنگی لبه بالای کارت — لهجه بصری (v25) */}
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold/60 via-emerald/50 to-primary/60" />
              <div className="mb-3 flex items-center justify-between">
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl", stat.bg, stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    stat.trendUp ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"
                  )}
                >
                  {stat.trend}
                </span>
              </div>
              <p className="text-2xl font-extrabold max-sm:text-lg">
                <Counter to={stat.value} format={stat.format} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue chart — داده‌محور با تولتیپ، هایلایت بهترین ماه و خط میانگین (v25) */}
      <div className="rounded-3xl border bg-card p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-emerald" />
            روند درآمد پلتفرم (۱۲ ماه)
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold",
              growth >= 0 ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"
            )}
          >
            {growth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {growth >= 0 ? "+" : ""}{toFa(growth)}٪ نسبت به ماه قبل
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          درآمد تأییدشده از رزرو تورها و سفارش تجهیزات — روی هر ستون بروید تا مبلغ دقیق را ببینید.
        </p>
        <div className="h-56 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a017" stopOpacity={1} />
                  <stop offset="100%" stopColor="#e8734a" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="adminRevBestGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0c14b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d4a017" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => toFa(Math.round(v / 1_000_000))}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.35 }} />
              <ReferenceLine
                y={avgRevenue}
                stroke="var(--muted-foreground)"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={38}>
                {trend.map((p, i) => (
                  <Cell
                    key={i}
                    fill={p.isBest ? "url(#adminRevBestGrad)" : "url(#adminRevGrad)"}
                    stroke={p.isBest ? "#f0c14b" : "none"}
                    strokeWidth={p.isBest ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* خلاصه نمودار */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-xs">
            <span className="text-muted-foreground">میانگین ماهانه</span>
            <span className="font-bold">{formatCurrency(avgRevenue)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gold/25 bg-gold/5 px-3 py-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-gold" />
              بهترین ماه
            </span>
            <span className="font-bold text-gold">
              {bestMonth ? `${bestMonth.label} — ${formatCurrency(bestMonth.revenue)}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald/25 bg-emerald/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">ماه جاری</span>
            <span className="font-bold text-emerald">
              {currentMonth ? formatCurrency(currentMonth.revenue) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Recent activity — داده‌واکنش‌گرا: لیست‌های خالی با دادهٔ سیستمی پر می‌شوند (v25) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Mountain className="h-5 w-5 text-primary" />
            تورهای اخیر لیدرها
          </h3>
          <div className="space-y-2">
            {(() => {
              type RecentTour = {
                id: string;
                title: string;
                destination: string;
                duration: number;
                status?: string;
                imageUrl?: string;
                images?: string[];
              };
              const recentTours: { t: RecentTour; source: "draft" | "mock" }[] = [
                ...draftTours.map((t) => ({ t, source: "draft" as const })),
                ...mockTours.slice(0, 6).map((t) => ({ t, source: "mock" as const })),
              ];
              return recentTours.slice(0, 6).map(({ t, source }) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 p-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    <SmartImage
                      src={source === "draft" ? (t.imageUrl ?? t.images?.[0] ?? "") : t.images![0]}
                      alt={t.title}
                      fallback="tour"
                      shimmer={false}
                      aspectClass="size-full"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.destination} • {toFa(t.duration)} روز</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    source === "draft"
                      ? t.status === "active"
                        ? "bg-emerald/10 text-emerald"
                        : "bg-gold/10 text-gold"
                      : "bg-primary/10 text-primary"
                  )}>
                    {source === "draft" ? (t.status === "active" ? "لیدر — منتشر" : "لیدر — پیش‌نویس") : "سیستمی"}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Store className="h-5 w-5 text-emerald" />
            محصولات اخیر فروشندگان
          </h3>
          <div className="space-y-2">
            {(() => {
              type RecentProduct = {
                id: string;
                title: string;
                brand: string;
                price: number;
                images: string[];
              };
              const recentProducts: { p: RecentProduct; source: "draft" | "mock" }[] = [
                ...draftProducts.map((p) => ({ p, source: "draft" as const })),
                ...mockEquipment.slice(0, 6).map((p) => ({ p, source: "mock" as const })),
              ];
              return recentProducts.slice(0, 6).map(({ p, source }) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 p-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    <SmartImage src={p.images[0]} alt={p.title} fallback="equipment" shimmer={false} aspectClass="size-full" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} • {formatCurrency(p.price)}</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    source === "draft" ? "bg-emerald/10 text-emerald" : "bg-primary/10 text-primary"
                  )}>
                    {source === "draft" ? "فروشنده" : "سیستمی"}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Tours Tab ---

function ToursTab() {
  const draftTours = useDraftTours((s) => s.tours);
  const removeTour = useDraftTours((s) => s.removeTour);
  const updateTour = useDraftTours((s) => s.updateTour);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "mock" | "draft">("all");

  const allTours = [
    ...draftTours.map((t) => ({ ...t, source: "draft" as const })),
    ...mockTours.map((t) => ({ ...t, source: "mock" as const })),
  ];

  const filtered = allTours.filter((t) => {
    const matchSearch = !search || t.title.includes(search) || t.destination.includes(search);
    const matchFilter = filter === "all" || t.source === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold">مدیریت تورها ({toFa(filtered.length)})</h3>
        <div className="flex gap-2 max-sm:flex-col">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="h-10 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-secondary p-1 max-sm:self-start">
            {(["all", "mock", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition max-sm:py-2",
                  filter === f ? "bg-background text-gold shadow-sm" : "text-muted-foreground"
                )}
              >
                {f === "all" ? "همه" : f === "mock" ? "سیستمی" : "لیدرها"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 24).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
            className="group overflow-hidden rounded-2xl border bg-card"
          >
            <div className="relative h-28 overflow-hidden">
              <SmartImage
                src={(t as { images?: string[]; imageUrl?: string }).images?.[0] ?? (t as { imageUrl?: string }).imageUrl ?? ""}
                alt={t.title}
                fallback="tour"
                shimmer={false}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
              <span className={cn(
                "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
                t.source === "draft" ? "bg-gold text-forest" : "bg-emerald text-white"
              )}>
                {t.source === "draft" ? "لیدر" : "سیستمی"}
              </span>
              {t.source === "draft" && (
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <button
                    onClick={() => {
                      if (t.status === "active") {
                        updateTour(t.id, { status: "draft" });
                        toast.info("تور از انتشار خارج شد");
                      } else {
                        updateTour(t.id, { status: "active" });
                        toast.success("تور منتشر شد");
                      }
                    }}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-background/90 text-foreground backdrop-blur transition hover:bg-gold hover:text-forest"
                    title={t.status === "active" ? "لغو انتشار" : "انتشار"}
                  >
                    {t.status === "active" ? <Check className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      removeTour(t.id);
                      toast.error("تور حذف شد");
                    }}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-background/90 text-foreground backdrop-blur transition hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-bold">{t.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.destination}</span>
                <span className="text-xs font-bold text-emerald">{formatCurrency(t.price)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Equipment Tab ---

function EquipmentTab() {
  const draftProducts = useDraftProducts((s) => s.products);
  const removeProduct = useDraftProducts((s) => s.removeProduct);

  const allProducts = [
    ...draftProducts.map((p) => ({ ...p, source: "draft" as const })),
    ...mockEquipment.map((p) => ({ ...p, source: "mock" as const })),
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">مدیریت تجهیزات ({toFa(allProducts.length)})</h3>
      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <Table className="max-lg:min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pr-5 text-right">محصول</TableHead>
              <TableHead className="text-right">برند</TableHead>
              <TableHead className="text-right">قیمت</TableHead>
              <TableHead className="text-right">موجودی</TableHead>
              <TableHead className="text-right">منبع</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allProducts.slice(0, 20).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="py-3 pr-5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                      <SmartImage src={p.images[0]} alt={p.title} fallback="equipment" shimmer={false} aspectClass="size-full" className="object-cover" />
                    </div>
                    <span className="text-sm font-medium">{p.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{p.brand}</TableCell>
                <TableCell className="text-xs font-semibold">{formatCurrency(p.price)}</TableCell>
                <TableCell className="text-xs">{toFa(p.stock)}</TableCell>
                <TableCell>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    p.source === "draft" ? "bg-gold/10 text-gold" : "bg-emerald/10 text-emerald"
                  )}>
                    {p.source === "draft" ? "فروشنده" : "سیستمی"}
                  </span>
                </TableCell>
                <TableCell>
                  {p.source === "draft" && (
                    <button
                      onClick={() => {
                        removeProduct(p.id);
                        toast.error("محصول حذف شد");
                      }}
                      className="relative grid h-8 w-8 place-items-center rounded-lg text-destructive transition hover:bg-destructive/10 max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {p.source === "mock" && <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// --- Leaders Tab ---

function LeadersTab() {
  const setStatus = useLeaderVerification((s) => s.setStatus);
  const getOverride = useLeaderVerification((s) => s.overrides);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">مدیریت لیدرها ({toFa(leaders.length)})</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.map((leader, i) => {
          // Read the effective status: override if exists, otherwise the mock default
          const effectiveStatus = getOverride[leader.id] ?? leader.verificationStatus;
          return (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <SmartImage
                  src={leader.avatar}
                  alt={leader.fullName}
                  fallback="avatar"
                  shimmer={false}
                  aspectClass="h-12 w-12 rounded-full"
                  className="object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold">{leader.fullName}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs text-muted-foreground">{toFa(leader.experienceYears)} سال تجربه</p>
                    {/* سطح لیدر (v25) */}
                    {(() => {
                      const lt = getLeaderTier(leader);
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold",
                            lt.badgeClass
                          )}
                        >
                          <span aria-hidden>{lt.icon}</span>
                          سطح {toFa(lt.level)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  effectiveStatus === "verified"
                    ? "bg-emerald/10 text-emerald"
                    : effectiveStatus === "pending"
                      ? "bg-gold/10 text-gold"
                      : "bg-destructive/10 text-destructive"
                )}>
                  {effectiveStatus === "verified" ? "تأیید شده" : effectiveStatus === "pending" ? "در انتظار" : "رد شده"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="text-sm font-bold">{toFa(leader.toursCount)}</p>
                  <p className="text-[10px] text-muted-foreground">تور</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="text-sm font-bold">{toFa(leader.rating)}</p>
                  <p className="text-[10px] text-muted-foreground">امتیاز</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="text-sm font-bold">{toFa(leader.satisfaction)}٪</p>
                  <p className="text-[10px] text-muted-foreground">رضایت</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-emerald"
                  disabled={effectiveStatus === "verified"}
                  onClick={() => {
                    setStatus(leader.id, "verified");
                    toast.success("لیدر تأیید شد", { description: leader.fullName });
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  تأیید
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-destructive"
                  disabled={effectiveStatus === "rejected"}
                  onClick={() => {
                    setStatus(leader.id, "rejected");
                    toast.error("لیدر رد شد", { description: leader.fullName });
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  رد
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// --- Sellers Tab ---

function SellersTab() {
  const draftProducts = useDraftProducts((s) => s.products);
  const sellerOrders = useSellerOrders((s) => s.orders);

  // Extract unique seller IDs from draft products
  const sellerIds = [...new Set(draftProducts.map((p) => p.sellerId))];

  const sellers = sellerIds.map((id) => {
    const products = draftProducts.filter((p) => p.sellerId === id);
    const orders = sellerOrders;
    const revenue = orders.filter((o) => o.status === "confirmed").reduce((s, o) => s + o.total, 0);
    return { id, productCount: products.length, revenue, name: products[0]?.title?.split("—")[0] ?? "فروشنده" };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">مدیریت فروشندگان ({toFa(Math.max(sellers.length, 1))})</h3>
      {sellers.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          <Store className="mx-auto mb-3 h-10 w-10 opacity-40" />
          هنوز فروشنده‌ای ثبت‌نام نکرده است
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald/10 text-emerald">
                  <Store className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{seller.name}</p>
                  <p className="text-xs text-muted-foreground">شناسه: {seller.id.slice(0, 12)}...</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="text-sm font-bold">{toFa(seller.productCount)}</p>
                  <p className="text-[10px] text-muted-foreground">محصول</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2">
                  <p className="text-sm font-bold text-emerald">{formatCurrency(seller.revenue)}</p>
                  <p className="text-[10px] text-muted-foreground">درآمد</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Also show mock seller orders for management */}
      <div className="rounded-3xl border bg-card p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold">
          <DollarSign className="h-5 w-5 text-emerald" />
          سفارش‌های فروشندگان ({toFa(sellerOrders.length)})
        </h4>
        <div className="space-y-2">
          {sellerOrders.slice(0, 10).map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.product}</p>
                <p className="text-xs text-muted-foreground">{o.customer} • {o.type === "rent" ? "اجاره" : "خرید"}</p>
              </div>
              <span className="text-sm font-bold text-emerald">{formatCurrency(o.total)}</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                o.status === "confirmed" ? "bg-emerald/10 text-emerald" :
                o.status === "pending" ? "bg-gold/10 text-gold" : "bg-destructive/10 text-destructive"
              )}>
                {o.status === "confirmed" ? "تأیید شده" : o.status === "pending" ? "در انتظار" : "لغو شده"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Users Tab ---

function UsersTab() {
  const userBookings = useBookings((s) => s.bookings);
  const userOrders = useOrders((s) => s.orders);

  // Simulated user list from booking/order data
  const userIds = new Set([
    ...userBookings.map((b) => b.tourId),
    ...userOrders.map((o) => o.id),
  ]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">مدیریت کاربران</h3>

      {/* User stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald"><Counter to={userBookings.length} format={toFa} /></p>
          <p className="mt-1 text-xs text-muted-foreground">رزرو تور</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold text-accent"><Counter to={userOrders.length} format={toFa} /></p>
          <p className="mt-1 text-xs text-muted-foreground">سفارش تجهیزات</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold text-gold"><Counter to={userIds.size} format={toFa} /></p>
          <p className="mt-1 text-xs text-muted-foreground">کاربر فعال</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold text-primary"><Counter to={15} format={toFa} /></p>
          <p className="mt-1 text-xs text-muted-foreground">کل کاربران</p>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="rounded-3xl border bg-card p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold">
          <Mountain className="h-5 w-5 text-primary" />
          رزروهای تور اخیر
        </h4>
        <div className="space-y-2">
          {userBookings.slice(0, 10).map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <SmartImage src={b.tourImage} alt={b.tourTitle} fallback="tour" shimmer={false} aspectClass="size-full" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{b.tourTitle}</p>
                <p className="text-xs text-muted-foreground">{toPersianShortDate(b.tourDate)} • {toFa(b.participants)} نفر</p>
              </div>
              <span className="text-sm font-bold text-emerald">{formatCurrency(b.totalPrice)}</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                b.status === "confirmed" ? "bg-emerald/10 text-emerald" :
                b.status === "pending" ? "bg-gold/10 text-gold" : "bg-destructive/10 text-destructive"
              )}>
                {b.status === "confirmed" ? "تأیید شده" : b.status === "pending" ? "در انتظار" : "لغو شده"}
              </span>
            </div>
          ))}
          {userBookings.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">هنوز رزروی ثبت نشده</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Bookings/Transactions Tab ---

function BookingsTab() {
  const leaderBookings = useLeaderBookings((s) => s.bookings);
  const sellerOrders = useSellerOrders((s) => s.orders);
  const userBookings = useBookings((s) => s.bookings);
  const userOrders = useOrders((s) => s.orders);

  const allTransactions = [
    ...leaderBookings.map((b) => ({ id: b.id, type: "تور", desc: b.tourTitle, customer: b.traveler, amount: b.totalPrice, date: b.date, status: b.status })),
    ...sellerOrders.map((o) => ({ id: o.id, type: o.type === "rent" ? "اجاره" : "تجهیزات", desc: o.product, customer: o.customer, amount: o.total, date: o.date, status: o.status })),
    ...userBookings.map((b) => ({ id: b.id, type: "رزرو کاربر", desc: b.tourTitle, customer: "—", amount: b.totalPrice, date: b.tourDate, status: b.status })),
    ...userOrders.map((o) => ({ id: o.id, type: "سفارش کاربر", desc: o.items, customer: "—", amount: o.total, date: o.date, status: o.status === "processing" ? "pending" : o.status === "delivered" ? "confirmed" : "cancelled" })),
  ];

  const totalRevenue = allTransactions
    .filter((t) => t.status === "confirmed")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex max-sm:flex-col max-sm:items-start max-sm:gap-2 items-center justify-between">
        <h3 className="text-lg font-bold">تراکنش‌ها ({toFa(allTransactions.length)})</h3>
        <div className="rounded-full bg-emerald/10 px-4 py-2 text-sm font-bold text-emerald max-sm:py-1.5">
          کل درآمد: {formatCurrency(totalRevenue)}
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <Table className="max-lg:min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pr-5 text-right">شناسه</TableHead>
              <TableHead className="text-right">نوع</TableHead>
              <TableHead className="text-right">شرح</TableHead>
              <TableHead className="text-right">مشتری</TableHead>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTransactions.slice(0, 30).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="py-2 pr-5 font-mono text-[10px] text-muted-foreground">{t.id.slice(0, 16)}</TableCell>
                <TableCell className="text-xs">{t.type}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{t.desc}</TableCell>
                <TableCell className="text-xs">{t.customer}</TableCell>
                <TableCell className="text-xs">{toPersianShortDate(t.date)}</TableCell>
                <TableCell className="text-xs font-semibold">{formatCurrency(t.amount)}</TableCell>
                <TableCell>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    t.status === "confirmed" ? "bg-emerald/10 text-emerald" :
                    t.status === "pending" ? "bg-gold/10 text-gold" : "bg-destructive/10 text-destructive"
                  )}>
                    {t.status === "confirmed" ? "تأیید شده" : t.status === "pending" ? "در انتظار" : "لغو شده"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// --- Settings Tab ---

function SettingsTab() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h3 className="text-lg font-bold">تنظیمات پلتفرم</h3>

      {/* Platform info */}
      <div className="rounded-3xl border bg-card p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold">
          <Settings className="h-5 w-5 text-gold" />
          اطلاعات پلتفرم
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">نام پلتفرم</label>
            <input
              defaultValue="کوچ‌نشین"
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">شماره پشتیبانی</label>
            <input
              defaultValue="09152286636"
              dir="ltr"
              className="h-10 w-full rounded-xl border bg-background px-3 text-right text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-muted-foreground">آدرس</label>
            <input
              defaultValue="مشهد، بلوار فلاحی، فلاحی ۱، دانشگاه خیام"
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <Button
          onClick={() => toast.success("تغییرات ذخیره شد")}
          className="mt-4 bg-gold text-forest"
        >
          ذخیره
        </Button>
      </div>

      {/* System status */}
      <div className="rounded-3xl border bg-card p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold">
          <AlertCircle className="h-5 w-5 text-emerald" />
          وضعیت سیستم
        </h4>
        <div className="space-y-3">
          {[
            { label: "سرور", status: "آنلاین", color: "text-emerald" },
            { label: "پایگاه داده", status: "متصل", color: "text-emerald" },
            { label: "سیستم احراز هویت", status: "فعال", color: "text-emerald" },
            { label: "پرداخت", status: "حالت نمایشی", color: "text-gold" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border p-3">
              <span className="text-sm font-semibold">{item.label}</span>
              <span className={cn("flex items-center gap-1 text-sm font-bold", item.color)}>
                <CheckCircle2 className="h-4 w-4" />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold text-destructive">
          <AlertCircle className="h-5 w-5" />
          منطقه خطر
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-destructive/20 p-3">
            <div>
              <p className="text-sm font-semibold">پاک کردن همه داده‌های نمایشی</p>
              <p className="text-xs text-muted-foreground">تمام رزروها، سفارش‌ها و محصولات ساخته‌شده حذف می‌شوند</p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => {
                localStorage.clear();
                toast.success("همه داده‌ها پاک شد", { description: "صفحه رفرش می‌شود" });
                setTimeout(() => window.location.reload(), 1500);
              }}
            >
              پاک کردن
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
