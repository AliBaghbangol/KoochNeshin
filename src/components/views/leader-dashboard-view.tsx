"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  PlusCircle,
  CalendarCheck,
  BarChart3,
  MessageSquare,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Send,
  Lock,
  Crown,
  Award,
  Download,
  ArrowLeft,
  Filter,
  FileEdit,
  Sparkles,
  Upload,
  ThumbsUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useDraftTours } from "@/store/draft-tours-store";
import { useLeaderBookings } from "@/store/leader-bookings-store";
import { useLeaderMessages } from "@/store/leader-messages-store";
import { useLeaderProfile } from "@/store/leader-profile-store";
import { useEditingDraft } from "@/store/editing-draft-store";
import { leaders } from "@/mocks/leaders";
import { tours, getToursByLeader, getCompetingTours } from "@/mocks/tours";
import { useMyTours } from "@/hooks/use-all-tours";
import { getLeaderTier } from "@/lib/leader-tiers";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  toFa,
  formatCurrency,
  toPersianShortDate,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";
import { SmartImage } from "@/components/common/smart-image";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Tour, TourStatus, BookingStatus } from "@/types";

type TabKey =
  | "overview"
  | "my-tours"
  | "create"
  | "bookings"
  | "competitive"
  | "messages";

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { key: "my-tours", label: "تورهای من", icon: Map },
  { key: "create", label: "ایجاد تور", icon: PlusCircle },
  { key: "bookings", label: "رزروها", icon: CalendarCheck },
  { key: "competitive", label: "آمار رقابتی", icon: BarChart3 },
  { key: "messages", label: "پیام‌ها", icon: MessageSquare },
];

// Mock bookings + conversations have been moved to Zustand stores:
//   - useLeaderBookings (src/store/leader-bookings-store.ts)
//   - useLeaderMessages (src/store/leader-messages-store.ts)

export function LeaderDashboardView() {
  const { isAuthenticated, role, leaderVerification, user } = useAuth();
  const { setAuthOpen } = useNav();
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");
  const isPro = useLeaderProfile((s) => s.isPro(user?.id ?? "l1"));
  const setUpgradeToPro = useLeaderProfile((s) => s.setUpgradeToPro);

  // Not authenticated at all
  if (!isAuthenticated || role === "guest") {
    return (
      <GatePrompt
        icon={<Lock className="h-10 w-10" />}
        title="ورود به پنل لیدر"
        description="برای دسترسی به داشبورد لیدر، ابتدا وارد حساب کاربری خود شوید یا به‌عنوان لیدر ثبت‌نام کنید."
        cta="ورود / ثبت‌نام"
        onCta={() => setAuthOpen(true)}
      />
    );
  }

  // Logged in but not as leader
  if (role === "traveler") {
    return (
      <GatePrompt
        icon={<MountainIcon />}
        title="شما لیدر نیستید"
        description="برای دسترسی به این پنل باید به‌عنوان لیدر ثبت‌نام کنید و مدارک خود را ارسال کنید."
        cta="ثبت‌نام به‌عنوان لیدر"
        onCta={() => setAuthOpen(true)}
      />
    );
  }

  const pending = leaderVerification === "pending";

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Pending banner */}
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 md:flex-row md:items-center md:gap-4"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
              <Clock className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-forest dark:text-cream">در انتظار تأیید مدارک</h4>
              <p className="text-sm text-muted-foreground">
                مدارک شما در حال بررسی است. می‌توانید پیش‌نمایش داشبورد را ببینید اما امکان انتشار تور پس از تأیید فعال خواهد شد.
              </p>
            </div>
            <Badge className="bg-gold text-forest">در انتظار</Badge>
          </motion.div>
        )}

        {/* Header */}
        <ScrollReveal>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <SmartImage
                src={leaders[0].avatar}
                alt={user?.fullName ?? leaders[0].fullName}
                fallback="avatar"
                shimmer={false}
                aspectClass="h-14 w-14 shrink-0 rounded-2xl ring-2 ring-gold"
                className="h-full w-full object-cover"
              />
              <div>
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold md:text-3xl">
                  سلام، {user?.fullName ?? leaders[0].fullName} 👋
                  {/* سطح‌بندی لیدر (v25) */}
                  {(() => {
                    const headerTier = getLeaderTier(leaders[0]);
                    return (
                      <Badge className={cn("border", headerTier.badgeClass)}>
                        <span aria-hidden>{headerTier.icon}</span>
                        سطح {toFa(headerTier.level)} — {headerTier.label}
                      </Badge>
                    );
                  })()}
                  {isPro && (
                    <Badge className="border-sunset/40 bg-sunset/15 text-gold">
                      <Crown className="h-3 w-3" />
                      حرفه‌ای
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  خوش آمدید به پنل مدیریت لیدر — وضعیت فعالیت خود را مدیریت کنید.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setActiveTab("create")}
              className="bg-primary text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4" />
              ایجاد تور جدید
            </Button>
          </div>
        </ScrollReveal>

        {/* Mobile tabs */}
        <div className="mb-6 md:hidden">
          <div className="custom-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  data-tab={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "border-emerald bg-emerald text-cream"
                      : "border-border bg-card text-muted-foreground hover:border-emerald/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar (desktop) */}
          <aside className="hidden md:block">
            <Card className="sticky top-28 rounded-3xl border-border/60 bg-card p-3">
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? "bg-emerald text-cream shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {active && <ChevronLeft className="h-4 w-4" />}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-3 rounded-2xl bg-gradient-to-bl from-forest to-emerald-dark p-4 text-cream">
                <Crown className="mb-2 h-5 w-5 text-gold" />
                <p className="text-xs leading-5 text-cream/80">
                  با ارتقای پلن خود به پلن حرفه‌ای، امکانات بیشتری مانند تحلیل پیشرفته رقبا دریافت کنید.
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full bg-gold text-forest hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPro}
                  onClick={() => {
                    setUpgradeToPro(user?.id ?? "l1");
                    toast.success("به پلن حرفه‌ای ارتقا یافتید", {
                      description: "امکانات ویژه پلن حرفه‌ای فعال شد.",
                    });
                  }}
                >
                  {isPro ? "شما پلن حرفه‌ای دارید" : "ارتقا به پلن حرفه‌ای"}
                </Button>
              </div>
            </Card>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "overview" && <OverviewTab onViewAllBookings={() => setActiveTab("bookings")} />}
                {activeTab === "my-tours" && <MyToursTab onEditDraft={() => setActiveTab("create")} />}
                {activeTab === "create" && <CreateTourTab />}
                {activeTab === "bookings" && <BookingsTab />}
                {activeTab === "competitive" && <CompetitiveTab />}
                {activeTab === "messages" && <MessagesTab />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ===== Auth gate prompt =====
function GatePrompt({
  icon,
  title,
  description,
  cta,
  onCta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  onCta: () => void;
}) {
  const go = useGo();
  return (
    <div className="relative min-h-[80vh] overflow-hidden pt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald/5 to-background" />
      <div className="relative mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-16 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-emerald/10 text-emerald">
          {icon}
        </div>
        <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onCta} className="bg-primary text-primary-foreground">
            {cta}
          </Button>
          <Button size="lg" variant="outline" onClick={() => go("home")}>
            بازگشت به خانه
          </Button>
        </div>
      </div>
    </div>
  );
}

function MountainIcon() {
  return <Briefcase className="h-10 w-10" />;
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ onViewAllBookings }: { onViewAllBookings: () => void }) {
  const go = useGo();
  const { user } = useAuth();
  const leader = leaders[0];
  const myTours = useMyTours(user?.id ?? "l1");
  const activeTours = myTours.filter((t) => t.status === "active");
  const leaderBookings = useLeaderBookings((s) => s.bookings);
  const totalBookings = leaderBookings.length;
  const confirmedBookings = leaderBookings.filter((b) => b.status === "confirmed").length;

  const myAvgRating =
    myTours.length > 0
      ? myTours.reduce((s, t) => s + t.rating, 0) / myTours.length
      : leader.rating;

  const [badgesOpen, setBadgesOpen] = React.useState(false);

  const bookingData = leader.bookingTrend.map((d) => ({
    month: d.month,
    bookings: d.bookings,
  }));

  // Real CSV download via the shared RFC 4180 helper (src/lib/csv.ts):
  // BOM for Excel, fields quoted, embedded quotes doubled.
  const downloadReport = () => {
    downloadCsv(
      `گزارش-فعالیت-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ["تاریخ", "تور", "مسافر", "مبلغ", "وضعیت"],
        ...leaderBookings.map((b) => [
          b.date,
          b.tourTitle,
          b.traveler,
          b.totalPrice,
          b.status,
        ]),
      ],
    );
    toast.success("گزارش دانلود شد", {
      description: `${toFa(leaderBookings.length)} ردیف رزرو در فایل CSV.`,
    });
  };

  const BADGES = [
    { id: "b1", title: "لیدر تازه‌کار", desc: "ثبت‌نام موفق در کوچ‌نشین", hint: "با ثبت‌نام در کوچ‌نشین این نشان خودکار فعال می‌شود.", earned: true, icon: Sparkles },
    { id: "b2", title: "۵ تور موفق", desc: "حداقل ۵ تور منتشر شده", hint: `۵ تور منتشر کنید — فعلاً ${toFa(myTours.length)} تور دارید.`, earned: myTours.length >= 5, icon: Award },
    { id: "b3", title: "امتیاز طلایی", desc: "میانگین امتیاز بالای ۴.۵", hint: `میانگین امتیاز تورهایتان را بالای ۴٫۵ ببرید (فعلاً ${toFa(myAvgRating.toFixed(1))}).`, earned: myAvgRating >= 4.5, icon: Star },
    { id: "b4", title: "۱۰۰٪ رضایت مسافر", desc: "بدون دریافت نظرات منفی", hint: "با برگزاری بی‌نقص تورها، بدون هیچ نظر منفی این نشان را می‌گیرید.", earned: false, icon: ThumbsUp },
  ];
  // سطح فعلی لیدر (v25)
  const tier = getLeaderTier({
    toursCount: myTours.length || leader.toursCount,
    rating: leader.rating,
    experienceYears: leader.experienceYears,
    satisfaction: leader.satisfaction,
  });

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        <KpiCard
          icon={<Briefcase className="h-5 w-5" />}
          tint="emerald"
          label="کل تورها"
          value={myTours.length}
          trend={{ dir: "up", value: "+۲" }}
        />
        <KpiCard
          icon={<MapPin className="h-5 w-5" />}
          tint="gold"
          label="تورهای فعال"
          value={activeTours.length}
          trend={{ dir: "up", value: "+۱" }}
        />
        <KpiCard
          icon={<CalendarCheck className="h-5 w-5" />}
          tint="sunset"
          label="کل رزروها"
          value={totalBookings}
          trend={{ dir: "up", value: "+۵" }}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          tint="emerald"
          label="رزروهای تأییدشده"
          value={confirmedBookings}
          trend={{ dir: "up", value: "+۳" }}
        />
        <KpiCard
          icon={<Star className="h-5 w-5" />}
          tint="emerald-light"
          label="امتیاز میانگین"
          value={leader.rating}
          format={(n) => toFa(n.toFixed(1))}
          decimals={1}
          trend={{ dir: "up", value: "۰.۱" }}
        />
      </div>

      {/* Booking trend chart + recent bookings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Chart */}
        <Card className="rounded-3xl border-border/60 bg-card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">روند رزروهای ماهانه</h3>
              <p className="text-xs text-muted-foreground">شش ماه گذشته</p>
            </div>
            <Badge className="bg-emerald/10 text-emerald">
              <TrendingUp className="h-3 w-3" />
              رشد ۱۲٪
            </Badge>
          </div>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData} margin={{ top: 5, right: 5, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="bookings" fill="url(#ovBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent bookings */}
        <Card className="rounded-3xl border-border/60 bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">رزروهای اخیر</h3>
            <Button variant="ghost" size="sm" className="text-emerald" onClick={onViewAllBookings}>
              مشاهده همه
            </Button>
          </div>
          <div className="space-y-3">
            {leaderBookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 transition-colors hover:bg-muted/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{b.traveler}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{b.tourTitle}</div>
                </div>
                <div className="shrink-0 text-left">
                  <div className="text-xs font-bold text-emerald">{formatCurrency(b.totalPrice)}</div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLinkCard
          onClick={() => go("leader-profile", { id: user?.id ?? "l1" })}
          icon={<Eye className="h-5 w-5" />}
          title="پروفایل عمومی من"
          desc="صفحه لیدر خود را به‌صورت عمومی ببینید"
        />
        <QuickLinkCard
          onClick={downloadReport}
          icon={<Download className="h-5 w-5" />}
          title="دانلود گزارش فعالیت"
          desc="گزارش کامل رزروها و درآمد در اکسل"
        />
        <QuickLinkCard
          onClick={() => setBadgesOpen(true)}
          icon={<Award className="h-5 w-5" />}
          title="نشان‌های افتخار"
          desc="نشان‌های دریافتی از کوچ‌نشین را ببینید"
        />
      </div>

      {/* Badges dialog */}
      <Dialog open={badgesOpen} onOpenChange={setBadgesOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>نشان‌های افتخار</DialogTitle>
          </DialogHeader>
          {/* سطح فعلی لیدر + پیشرفت (v25) */}
          <div className={cn("rounded-2xl border p-4", tier.badgeClass)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-extrabold">
                <span aria-hidden className="text-xl">{tier.icon}</span>
                سطح {toFa(tier.level)}: {tier.label}
              </span>
              <span className="text-[11px] font-bold opacity-80">{tier.description}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/50">
              <div
                className="h-full rounded-full bg-current transition-all"
                style={{ width: `${tier.progressToNext}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-bold opacity-90">
              {tier.nextLabel
                ? `${toFa(tier.pointsToNext ?? 0)} امتیاز دیگر تا سطح «${tier.nextLabel}»`
                : "بالاترین سطح ممکن — درخشیدی!"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                    b.earned
                      ? "border-gold/40 bg-gold/5"
                      : "border-border/60 bg-muted/30 opacity-60"
                  }`}
                >
                  {/* تولتیپ راهنمای کسب نشان (v25) */}
                  <IconTooltip label={b.hint} side="top">
                    <span
                      className={`grid size-12 cursor-help place-items-center rounded-2xl ${
                        b.earned
                          ? "bg-gold/15 text-gold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.earned ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                    </span>
                  </IconTooltip>
                  <div className="text-sm font-bold">{b.title}</div>
                  <div className="text-[11px] text-muted-foreground">{b.desc}</div>
                  {b.earned ? (
                    <Badge className="bg-emerald/10 text-emerald">کسب شده</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">قفل</Badge>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgesOpen(false)}>بستن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickLinkCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-5 text-right transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-md"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald/10 text-emerald transition-colors group-hover:bg-emerald group-hover:text-cream">
        {icon}
      </span>
      <div className="flex-1">
        <div className="font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-emerald" />
    </button>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tint,
  format,
  decimals,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: "emerald" | "gold" | "sunset" | "emerald-light";
  format?: (n: number) => string;
  /** ارقام اعشار — فقط برای آمارهایی مثل امتیاز میانگین (۱ رقم). */
  decimals?: number;
  trend?: { dir: "up" | "down"; value: string };
}) {
  const tintMap = {
    emerald: "bg-emerald/10 text-emerald",
    gold: "bg-gold/15 text-gold",
    sunset: "bg-sunset/10 text-sunset",
    "emerald-light": "bg-emerald-light/10 text-emerald-light",
  };
  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-sm max-sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tintMap[tint]}`}>
          {icon}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.dir === "up"
                ? "bg-emerald/10 text-emerald"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {trend.dir === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold tracking-tight">
        <Counter to={value} format={format} decimals={decimals} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map = {
    confirmed: { cls: "bg-emerald/10 text-emerald", label: "تأیید شده", icon: CheckCircle2 },
    pending: { cls: "bg-gold/15 text-gold", label: "در انتظار", icon: Clock },
    cancelled: { cls: "bg-destructive/10 text-destructive", label: "لغو شده", icon: XCircle },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ============================================
// MY TOURS TAB
// ============================================
function MyToursTab({ onEditDraft }: { onEditDraft?: () => void }) {
  const go = useGo();
  const { user } = useAuth();
  const myTours = useMyTours(user?.id ?? "l1");
  const draftTours = useDraftTours((s) => s.tours);
  const removeDraft = useDraftTours((s) => s.removeTour);
  const setEditingDraft = useEditingDraft((s) => s.setEditing);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">تورهای من</h3>
          <p className="text-sm text-muted-foreground">
            {toFa(myTours.length)} تور فعال + {toFa(draftTours.length)} پیش‌نویس
          </p>
        </div>
      </div>

      {/* Draft tours section */}
      {draftTours.length > 0 && (
        <Card className="rounded-3xl border-gold/30 bg-gold/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-gold" />
              <h4 className="font-bold text-gold">تورهای پیش‌نویس</h4>
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                {toFa(draftTours.length)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {draftTours.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-card p-3"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                  <FileEdit className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.destination} • {toFa(d.duration)} روز • {formatCurrency(d.price)}
                  </p>
                </div>
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                  پیش‌نویس
                </span>
                <button
                  onClick={() => {
                    setEditingDraft(d.id);
                    onEditDraft?.();
                  }}
                  className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                  title="ویرایش پیش‌نویس"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    removeDraft(d.id);
                    toast.success("پیش‌نویس حذف شد");
                  }}
                  className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <Table className="max-lg:min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pr-5 text-right">تور</TableHead>
              <TableHead className="text-right">دسته</TableHead>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right">ظرفیت</TableHead>
              <TableHead className="text-right">قیمت</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myTours.map((t) => (
              <MyTourRow key={t.id} tour={t} onView={() => go("tour-detail", { id: t.id })} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MyTourRow({ tour, onView }: { tour: Tour; onView: () => void }) {
  const fillPct = Math.round((tour.reservedCount / tour.capacity) * 100);
  return (
    <TableRow className="group">
      <TableCell className="py-3 pr-5">
        <div className="flex items-center gap-3">
          <SmartImage
            src={tour.images[0]}
            alt={tour.title}
            fallback="tour"
            fallbackLabel={CATEGORY_LABELS[tour.category]}
            aspectClass="h-12 w-16 shrink-0 rounded-xl"
            className="h-full w-full object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{tour.title}</div>
            <div className="text-[11px] text-muted-foreground">{tour.destination}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="bg-emerald/10 text-emerald">
          {CATEGORY_LABELS[tour.category]}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">{toPersianShortDate(tour.startDate)}</TableCell>
      <TableCell>
        <div className="w-24">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span>{toFa(tour.reservedCount)}/{toFa(tour.capacity)}</span>
            <span>{toFa(fillPct)}٪</span>
          </div>
          <Progress value={fillPct} className="h-1.5" />
        </div>
      </TableCell>
      <TableCell className="text-xs font-semibold">
        {tour.discountPrice ? formatCurrency(tour.discountPrice) : formatCurrency(tour.price)}
      </TableCell>
      <TableCell>
        <TourStatusBadge status={tour.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="relative h-8 w-8 text-muted-foreground hover:text-emerald max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
            onClick={onView}
            title="مشاهده"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="relative h-8 w-8 text-muted-foreground hover:text-gold max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
            onClick={() => toast.success("فرم ویرایش باز شد")}
            title="ویرایش"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="relative h-8 w-8 text-muted-foreground hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
            onClick={() => toast.error("تور حذف شد (شبیه‌سازی)")}
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function TourStatusBadge({ status }: { status: TourStatus }) {
  const map: Record<TourStatus, { cls: string; label: string }> = {
    active: { cls: "bg-emerald/10 text-emerald", label: "فعال" },
    full: { cls: "bg-gold/15 text-gold", label: "تکمیل ظرفیت" },
    finished: { cls: "bg-muted text-muted-foreground", label: "تمام‌شده" },
    draft: { cls: "bg-sunset/10 text-sunset", label: "پیش‌نویس" },
  };
  const cfg = map[status];
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
}

// ============================================
// CREATE TOUR TAB — 3-step stepper
// ============================================
interface TourFormState {
  title: string;
  destination: string;
  province: string;
  category: string;
  difficulty: string;
  duration: string;
  capacity: string;
  price: string;
  discountPrice: string;
  startDate: string;
  description: string;
  imageUrl: string;
  lat: string;
  lng: string;
  facilities: string[];
  itinerary: { day: number; title: string; description: string; elevation: string; distance: string; meals: string[] }[];
}

function CreateTourTab() {
  const { user } = useAuth();
  const [step, setStep] = React.useState(1);
  const addDraftTour = useDraftTours((s) => s.addTour);
  const updateDraftTour = useDraftTours((s) => s.updateTour);
  const draftTours = useDraftTours((s) => s.tours);
  const editingId = useEditingDraft((s) => s.editingId);
  const setEditingDraft = useEditingDraft((s) => s.setEditing);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [form, setForm] = React.useState<TourFormState>({
    title: "",
    destination: "",
    province: "",
    category: "mountain",
    difficulty: "medium",
    duration: "",
    capacity: "",
    price: "",
    discountPrice: "",
    startDate: "",
    description: "",
    imageUrl: "",
    lat: "",
    lng: "",
    facilities: [],
    itinerary: [],
  });

  // Load editing draft into form when editingId changes
  React.useEffect(() => {
    if (editingId) {
      const draft = draftTours.find((d) => d.id === editingId);
      if (draft) {
        setForm({
          title: draft.title,
          destination: draft.destination,
          province: draft.province ?? "",
          // Fallbacks keep the Select inputs controlled even for older/partial
          // drafts that were persisted without these fields.
          category: (draft.category ?? "mountain") as TourFormState["category"],
          difficulty: (draft.difficulty ?? "medium") as TourFormState["difficulty"],
          duration: draft.duration != null ? String(draft.duration) : "",
          capacity: draft.capacity != null ? String(draft.capacity) : "",
          price: draft.price != null ? String(draft.price) : "",
          discountPrice: draft.discountPrice ? String(draft.discountPrice) : "",
          startDate: draft.startDate ?? "",
          description: draft.description ?? "",
          imageUrl: draft.imageUrl ?? "",
          lat: draft.lat ? String(draft.lat) : "",
          lng: draft.lng ? String(draft.lng) : "",
          facilities: draft.facilities ?? [],
          itinerary: (draft.itinerary ?? []).map((d) => ({
            day: d.day,
            title: d.title,
            description: d.description,
            elevation: d.elevation ? String(d.elevation) : "",
            distance: d.distance ? String(d.distance) : "",
            meals: d.meals,
          })),
        });
        setStep(1);
        toast.info("پیش‌نویس برای ویرایش بارگذاری شد");
      }
    }
  }, [editingId, draftTours]);

  const set = <K extends keyof TourFormState>(k: K, v: TourFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const steps = [
    { id: 1, label: "اطلاعات پایه" },
    { id: 2, label: "تصاویر و مسیر" },
    { id: 3, label: "برنامه سفر" },
  ];

  const canNext = () => {
    if (step === 1) return form.title && form.destination && form.price;
    if (step === 2) return true;
    return true;
  };

  const handleSave = (publish = false) => {
    const tourData = {
      leaderId: user?.id ?? "draft-leader",
      title: form.title || "تور بدون عنوان",
      destination: form.destination || "نامشخص",
      province: form.province || "نامشخص",
      category: form.category,
      difficulty: form.difficulty,
      duration: Number(form.duration) || 1,
      capacity: Number(form.capacity) || 10,
      price: Number(form.price) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      startDate: form.startDate || new Date().toISOString().split("T")[0],
      description: form.description || "",
      imageUrl: form.imageUrl || undefined,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
      facilities: form.facilities,
      itinerary: form.itinerary.map((d) => ({
        day: d.day,
        title: d.title,
        description: d.description,
        elevation: d.elevation ? Number(d.elevation) : undefined,
        distance: d.distance ? Number(d.distance) : undefined,
        meals: d.meals,
      })),
      status: (publish ? "active" : "draft") as "draft" | "active",
    };

    // If editing, update; otherwise create
    if (editingId) {
      updateDraftTour(editingId, tourData);
      toast.success(
        publish ? "تور منتشر شد!" : "پیش‌نویس به‌روزرسانی شد",
        {
          description: publish
            ? "تور شما حالا برای مسافران قابل مشاهده و رزرو است."
            : "تغییرات شما در لیست تورهای من ذخیره شد.",
        },
      );
      setEditingDraft(null);
    } else {
      addDraftTour(tourData);
      toast.success(
        publish ? "تور منتشر شد!" : "تور ذخیره شد",
        {
          description: publish
            ? "تور شما حالا برای مسافران قابل مشاهده و رزرو است."
            : "تور شما در حالت پیش‌نویس قرار گرفت و در لیست تورهای من قابل مشاهده است.",
        },
      );
    }
    setStep(1);
    setForm({
      title: "",
      destination: "",
      province: "",
      category: "mountain",
      difficulty: "medium",
      duration: "",
      capacity: "",
      price: "",
      discountPrice: "",
      startDate: "",
      description: "",
      imageUrl: "",
      lat: "",
      lng: "",
      facilities: [],
      itinerary: [],
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">
            {editingId ? "ویرایش پیش‌نویس تور" : "ایجاد تور جدید"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {editingId
              ? "تغییرات پیش‌نویس را اعمال کنید"
              : "تور خود را در سه مرحله ثبت کنید"}
          </p>
        </div>
        {editingId && (
          <button
            onClick={() => {
              setEditingDraft(null);
              setForm({
                title: "",
                destination: "",
                province: "",
                category: "mountain",
                difficulty: "medium",
                duration: "",
                capacity: "",
                price: "",
                discountPrice: "",
                startDate: "",
                description: "",
                imageUrl: "",
                lat: "",
                lng: "",
                facilities: [],
                itinerary: [],
              });
              setStep(1);
            }}
            className="rounded-full border px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
          >
            لغو ویرایش
          </button>
        )}
      </div>
      {editingId && (
        <div className="flex items-center gap-2 rounded-xl bg-gold/10 p-3 text-sm text-gold">
          <FileEdit className="h-4 w-4" />
          در حال ویرایش پیش‌نویس — تغییرات با ذخیره اعمال می‌شوند
        </div>
      )}

      {/* Stepper */}
      <Card className="rounded-3xl border-border/60 bg-card p-5">
        <div className="flex items-center">
          {steps.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`grid size-10 place-items-center rounded-full text-sm font-bold transition-all ${
                      done
                        ? "bg-emerald text-cream"
                        : active
                        ? "bg-gold text-forest ring-4 ring-gold/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : toFa(s.id)}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="mx-2 mb-6 h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-emerald"
                      initial={{ width: "0%" }}
                      animate={{ width: step > s.id ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Step content */}
      <Card className="rounded-3xl border-border/60 bg-card p-6">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Field label="عنوان تور *">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="مثلاً صعود پاییزی قله دماوند"
                className="bg-background"
              />
            </Field>
            <Field label="مقصد *">
              <Input
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="قله دماوند"
                className="bg-background"
              />
            </Field>
            <Field label="استان">
              <Input
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                placeholder="مازندران"
                className="bg-background"
              />
            </Field>
            <Field label="دسته‌بندی">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="سختی">
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="مدت زمان (روز)">
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="۴"
                className="bg-background"
              />
            </Field>
            <Field label="ظرفیت (نفر)">
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                placeholder="۱۵"
                className="bg-background"
              />
            </Field>
            <Field label="قیمت (تومان) *">
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="۳۲۰۰۰۰۰"
                className="bg-background"
              />
            </Field>
            <Field label="قیمت با تخفیف (اختیاری)">
              <Input
                type="number"
                value={form.discountPrice}
                onChange={(e) => set("discountPrice", e.target.value)}
                placeholder="۲۷۵۰۰۰۰"
                className="bg-background"
              />
            </Field>
            <Field label="تاریخ شروع">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="bg-background"
              />
            </Field>
            <Field label="توضیحات" full>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="توضیحات کامل تور، برنامه، تجهیزات مورد نیاز و..."
                rows={3}
                className="bg-background"
              />
            </Field>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const MAX_FILE_SIZE = 2 * 1024 * 1024;
                if (file.size > MAX_FILE_SIZE) {
                  toast.error("حجم فایل باید کمتر از ۲ مگابایت باشد");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  set("imageUrl", dataUrl);
                  toast.success("تصویر بارگذاری شد");
                };
                reader.onerror = () => toast.error("خطا در بارگذاری تصویر");
                reader.readAsDataURL(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <Field label="آدرس تصویر اصلی" full>
              <div className="flex gap-2 max-sm:flex-col">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="bg-background"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5 max-sm:w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  آپلود از سیستم
                </Button>
              </div>
            </Field>
            {form.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-border/60">
                <SmartImage
                  src={form.imageUrl}
                  alt="preview"
                  fallback="tour"
                  shimmer={false}
                  aspectClass="h-48 w-full"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="عرض جغرافیایی (lat)">
                <Input
                  value={form.lat}
                  onChange={(e) => set("lat", e.target.value)}
                  placeholder="35.7128"
                  className="bg-background"
                  dir="ltr"
                />
              </Field>
              <Field label="طول جغرافیایی (lng)">
                <Input
                  value={form.lng}
                  onChange={(e) => set("lng", e.target.value)}
                  placeholder="52.0909"
                  className="bg-background"
                  dir="ltr"
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => setMapOpen(true)}
            >
              <MapPin className="h-4 w-4" />
              انتخاب از روی نقشه
            </Button>
            <FacilitiesEditor
              facilities={form.facilities}
              onChange={(v) => set("facilities", v)}
            />

            {/* Map coordinate picker dialog — simple clickable SVG that
                approximates lat/lng from the click position. Iran's
                bounding box used here is roughly:
                  lat: 25 (south) → 40 (north)
                  lng: 44 (west)  → 63 (east)   */}
            <Dialog open={mapOpen} onOpenChange={setMapOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>انتخاب مختصات از روی نقشه</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground">
                  روی نقشه‌ی ایران کلیک کنید — مختصات تقریبی در فرم ست می‌شود.
                </p>
                <div
                  className="relative mx-auto aspect-[4/5] w-full max-w-xs cursor-crosshair overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-emerald/10 to-emerald/5"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    // SVG coordinate: y=0 → top (north, lat=40), y=height → bottom (south, lat=25)
                    // x=0 → left (west, lng=44),  x=width → right (east, lng=63)
                    const relX = (e.clientX - rect.left) / rect.width;
                    const relY = (e.clientY - rect.top) / rect.height;
                    const lng = 44 + relX * (63 - 44);
                    const lat = 40 - relY * (40 - 25);
                    set("lat", lat.toFixed(4));
                    set("lng", lng.toFixed(4));
                    setMapOpen(false);
                    toast.success("مختصات ست شد", {
                      description: `lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`,
                    });
                  }}
                >
                  <svg
                    viewBox="0 0 200 250"
                    className="absolute inset-0 h-full w-full text-emerald/40"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M70 10 C 90 5 130 10 150 25 C 170 40 175 60 165 85 C 160 100 175 110 175 130 C 175 160 165 195 140 220 C 120 240 95 245 80 235 C 60 220 55 195 60 170 C 62 150 45 140 40 120 C 35 95 50 70 60 50 C 65 35 60 20 70 10 Z" />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="rounded-full bg-background/80 px-3 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur">
                      ایران — برای انتخاب کلیک کنید
                    </span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMapOpen(false)}>بستن</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <ItineraryEditor
              itinerary={form.itinerary}
              onChange={(v) => set("itinerary", v)}
            />
          </motion.div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            <ChevronRight className="h-4 w-4" />
            مرحله قبل
          </Button>
          {step < 3 ? (
            <Button
              disabled={!canNext()}
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="bg-primary text-primary-foreground"
            >
              مرحله بعد
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => handleSave(false)}
                variant="outline"
                className="gap-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                ذخیره پیش‌نویس
              </Button>
              <Button
                onClick={() => handleSave(true)}
                className="bg-emerald text-cream gap-1 shadow-lg shadow-emerald/20"
              >
                <Sparkles className="h-4 w-4" />
                انتشار تور
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function FacilitiesEditor({
  facilities,
  onChange,
}: {
  facilities: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = React.useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!facilities.includes(v)) onChange([...facilities, v]);
    setInput("");
  };
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        امکانات تور
      </Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="راهنما، بیمه، اقامت..."
          className="bg-background"
        />
        <Button onClick={add} variant="outline" className="shrink-0">
          <PlusCircle className="h-4 w-4" />
          افزودن
        </Button>
      </div>
      {facilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {facilities.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs text-emerald"
            >
              {f}
              <button
                onClick={() => onChange(facilities.filter((x) => x !== f))}
                className="text-emerald/60 hover:text-destructive"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ItineraryEditor({
  itinerary,
  onChange,
}: {
  itinerary: TourFormState["itinerary"];
  onChange: (v: TourFormState["itinerary"]) => void;
}) {
  const [day, setDay] = React.useState({
    title: "",
    description: "",
    elevation: "",
    distance: "",
    meals: [] as string[],
  });

  const mealsList = ["صبحانه", "ناهار", "شام"];

  const addDay = () => {
    if (!day.title.trim()) {
      toast.error("عنوان روز را وارد کنید");
      return;
    }
    onChange([
      ...itinerary,
      { day: itinerary.length + 1, ...day },
    ]);
    setDay({ title: "", description: "", elevation: "", distance: "", meals: [] });
  };

  return (
    <div>
      <Label className="mb-2 block text-xs font-medium text-muted-foreground">
        برنامه سفر — روزها
      </Label>

      {itinerary.length > 0 && (
        <div className="mb-4 space-y-2">
          {itinerary.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald text-cream text-xs font-bold">
                {toFa(d.day)}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{d.title}</div>
                {d.description && (
                  <div className="text-xs text-muted-foreground">{d.description}</div>
                )}
                <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  {d.elevation && <span>ارتفاع: {toFa(d.elevation)}م</span>}
                  {d.distance && <span>مسافت: {toFa(d.distance)}km</span>}
                  {d.meals.length > 0 && <span>وعده‌ها: {d.meals.join("، ")}</span>}
                </div>
              </div>
              <button
                onClick={() => onChange(itinerary.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <div className="mb-3 text-xs font-semibold text-muted-foreground">
          افزودن روز جدید
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={day.title}
            onChange={(e) => setDay({ ...day, title: e.target.value })}
            placeholder="عنوان روز"
            className="bg-background"
          />
          <Input
            value={day.elevation}
            onChange={(e) => setDay({ ...day, elevation: e.target.value })}
            placeholder="ارتفاع (متر)"
            type="number"
            className="bg-background"
          />
          <Input
            value={day.distance}
            onChange={(e) => setDay({ ...day, distance: e.target.value })}
            placeholder="مسافت (km)"
            type="number"
            className="bg-background"
          />
          <div className="flex flex-wrap items-center gap-2">
            {mealsList.map((m) => {
              const sel = day.meals.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    setDay({
                      ...day,
                      meals: sel
                        ? day.meals.filter((x) => x !== m)
                        : [...day.meals, m],
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    sel
                      ? "border-emerald bg-emerald text-cream"
                      : "border-border bg-background text-muted-foreground hover:border-emerald/40"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <div className="md:col-span-2">
            <Textarea
              value={day.description}
              onChange={(e) => setDay({ ...day, description: e.target.value })}
              placeholder="توضیحات برنامه روز"
              rows={2}
              className="bg-background"
            />
          </div>
        </div>
        <Button
          onClick={addDay}
          variant="outline"
          className="mt-3 w-full border-emerald/40 text-emerald hover:bg-emerald/10"
        >
          <PlusCircle className="h-4 w-4" />
          افزودن به برنامه
        </Button>
      </div>
    </div>
  );
}

// ============================================
// BOOKINGS TAB
// ============================================
function BookingsTab() {
  const [filter, setFilter] = React.useState<"all" | BookingStatus>("all");
  const [search, setSearch] = React.useState("");
  const bookings = useLeaderBookings((s) => s.bookings);
  const confirmBooking = useLeaderBookings((s) => s.confirmBooking);
  const cancelBooking = useLeaderBookings((s) => s.cancelBooking);

  const filtered = bookings.filter((b) => {
    const okStatus = filter === "all" || b.status === filter;
    const okSearch =
      !search ||
      b.traveler.includes(search) ||
      b.tourTitle.includes(search);
    return okStatus && okSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold">رزروها</h3>
          <p className="text-sm text-muted-foreground">{toFa(filtered.length)} رزرو یافت شد</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی مسافر یا تور..."
              className="bg-background pr-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40 bg-background">
              <Filter className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="confirmed">تأیید شده</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="cancelled">لغو شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <Table className="max-lg:min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pr-5 text-right">مسافر</TableHead>
              <TableHead className="text-right">تور</TableHead>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right">نفرات</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="py-3 pr-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald/10 text-emerald">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium">{b.traveler}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{b.tourTitle}</TableCell>
                <TableCell className="text-xs">{toPersianShortDate(b.date)}</TableCell>
                <TableCell className="text-xs">{toFa(b.participants)} نفر</TableCell>
                <TableCell className="text-xs font-semibold">{formatCurrency(b.totalPrice)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {b.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-emerald hover:bg-emerald/10"
                          onClick={() => {
                            confirmBooking(b.id);
                            toast.success("رزرو تأیید شد", { description: `مسافر: ${b.traveler}` });
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            cancelBooking(b.id);
                            toast.error("رزرو لغو شد", { description: `مسافر: ${b.traveler}` });
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          لغو
                        </Button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <Badge className="bg-emerald/10 text-emerald">
                        <CheckCircle2 className="h-3 w-3" />
                        تایید شده
                      </Badge>
                    )}
                    {b.status === "cancelled" && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  رزروی مطابق فیلتر انتخابی یافت نشد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============================================
// COMPETITIVE TAB
// ============================================
function CompetitiveTab() {
  const { user } = useAuth();
  const myTours = useMyTours(user?.id ?? "l1");
  const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
  const myAvgPrice = safeDiv(
    myTours.reduce((s, t) => s + (t.discountPrice ?? t.price), 0),
    myTours.length
  );
  const myAvgRating = safeDiv(
    myTours.reduce((s, t) => s + t.rating, 0),
    myTours.length
  );
  const myAvgFill = safeDiv(
    myTours.reduce((s, t) => s + (t.reservedCount / Math.max(1, t.capacity)) * 100, 0),
    myTours.length
  );
  const myAvgDuration = safeDiv(
    myTours.reduce((s, t) => s + t.duration, 0),
    myTours.length
  );

  // Market average from all tours
  const all = tours;
  const mktAvgPrice = all.reduce((s, t) => s + (t.discountPrice ?? t.price), 0) / all.length;
  const mktAvgRating = all.reduce((s, t) => s + t.rating, 0) / all.length;
  const mktAvgFill = all.reduce((s, t) => s + (t.reservedCount / t.capacity) * 100, 0) / all.length;
  const mktAvgDuration = all.reduce((s, t) => s + t.duration, 0) / all.length;

  const radarData = [
    { metric: "قیمت", you: myAvgPrice / 100000, market: mktAvgPrice / 100000 },
    { metric: "امتیاز", you: myAvgRating * 20, market: mktAvgRating * 20 },
    { metric: "پر شدن ظرفیت", you: myAvgFill, market: mktAvgFill },
    { metric: "مدت زمان", you: myAvgDuration * 10, market: mktAvgDuration * 10 },
    { metric: "تعداد تور", you: myTours.length * 10, market: (all.length / 5) * 10 },
  ];

  // Bar chart: tours count per leader
  const leadersBarData = leaders.map((l) => ({
    name: l.fullName.split(" ")[0],
    tours: getToursByLeader(l.id).length,
  }));

  // Per-tour comparison
  const comparisons = myTours.map((t) => {
    const comps = getCompetingTours(t);
    const allPrices = [t.discountPrice ?? t.price, ...comps.map((c) => c.discountPrice ?? c.price)];
    const sorted = [...allPrices].sort((a, b) => a - b);
    const myPrice = t.discountPrice ?? t.price;
    let position = "میانگین";
    if (myPrice === sorted[0]) position = "ارزان‌ترین";
    else if (myPrice === sorted[sorted.length - 1]) position = "گران‌ترین";
    return { tour: t, comps, position };
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">آمار رقابتی</h3>
        <p className="text-sm text-muted-foreground">
          مقایسه عملکرد شما با میانگین بازار و سایر لیدرها
        </p>
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CompareStat
          label="میانگین قیمت شما"
          value={formatCurrency(Math.round(myAvgPrice))}
          market={formatCurrency(Math.round(mktAvgPrice))}
          better={myAvgPrice < mktAvgPrice}
        />
        <CompareStat
          label="میانگین امتیاز"
          value={toFa(myAvgRating.toFixed(2))}
          market={toFa(mktAvgRating.toFixed(2))}
          better={myAvgRating > mktAvgRating}
        />
        <CompareStat
          label="پر شدن ظرفیت"
          value={`${toFa(Math.round(myAvgFill))}٪`}
          market={`${toFa(Math.round(mktAvgFill))}٪`}
          better={myAvgFill > mktAvgFill}
        />
        <CompareStat
          label="میانگین مدت"
          value={`${toFa(Math.round(myAvgDuration))} روز`}
          market={`${toFa(Math.round(mktAvgDuration))} روز`}
          better={myAvgDuration >= mktAvgDuration}
        />
      </div>

      {/* Radar + bar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/60 bg-card p-6">
          <h4 className="mb-2 text-lg font-bold">نقاط قوت شما در برابر بازار</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            مقایسه نرمالایز شده در ۵ شاخص کلیدی
          </p>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={100}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} />
                <Radar name="شما" dataKey="you" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.5} strokeWidth={2} />
                <Radar name="بازار" dataKey="market" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-card p-6">
          <h4 className="mb-2 text-lg font-bold">تعداد تور لیدرها</h4>
          <p className="mb-3 text-xs text-muted-foreground">مقایسه با سایر لیدرهای فعال</p>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadersBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tours" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {leadersBarData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={leaders[i].id === (user?.id ?? "l1") ? "var(--chart-3)" : "var(--chart-1)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Per-tour comparison table */}
      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <div className="border-b border-border/60 p-5">
          <h4 className="text-lg font-bold">مقایسه تور به تور با رقبا</h4>
          <p className="text-xs text-muted-foreground">
            برای هر تور شما، تورهای مشابه در همان مقصد مقایسه شده است.
          </p>
        </div>
        <Table className="max-lg:min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pr-5 text-right">تور شما</TableHead>
              <TableHead className="text-right">قیمت شما</TableHead>
              <TableHead className="text-right">امتیاز</TableHead>
              <TableHead className="text-right">رقبا</TableHead>
              <TableHead className="text-right">میانگین قیمت رقبا</TableHead>
              <TableHead className="text-left">جایگاه شما</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map(({ tour, comps, position }) => {
              const avgCompPrice =
                comps.length > 0
                  ? comps.reduce((s, c) => s + (c.discountPrice ?? c.price), 0) / comps.length
                  : 0;
              return (
                <TableRow key={tour.id}>
                  <TableCell className="py-3 pr-5">
                    <div className="flex items-center gap-2">
                      <SmartImage
                        src={tour.images[0]}
                        alt={tour.title}
                        fallback="tour"
                        fallbackLabel={CATEGORY_LABELS[tour.category]}
                        aspectClass="h-10 w-14 shrink-0 rounded-lg"
                        className="h-full w-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{tour.title}</div>
                        <div className="text-[11px] text-muted-foreground">{tour.destination}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-emerald">
                    {formatCurrency(tour.discountPrice ?? tour.price)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gold">
                      <Star className="h-3 w-3 fill-current" />
                      {toFa(tour.rating.toFixed(1))}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{toFa(comps.length)} تور</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {comps.length > 0 ? formatCurrency(Math.round(avgCompPrice)) : "—"}
                  </TableCell>
                  <TableCell>
                    <PositionBadge position={position} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CompareStat({
  label,
  value,
  market,
  better,
}: {
  label: string;
  value: string;
  market: string;
  better: boolean;
}) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-[10px]">
        <span className="text-muted-foreground">بازار:</span>
        <span className={better ? "font-semibold text-emerald" : "font-semibold text-sunset"}>
          {market}
        </span>
        {better ? (
          <TrendingUp className="h-3 w-3 text-emerald" />
        ) : (
          <TrendingDown className="h-3 w-3 text-sunset" />
        )}
      </div>
    </Card>
  );
}

function PositionBadge({ position }: { position: string }) {
  const map: Record<string, string> = {
    "ارزان‌ترین": "bg-emerald/10 text-emerald",
    "گران‌ترین": "bg-sunset/10 text-sunset",
    "میانگین": "bg-gold/15 text-gold",
  };
  return (
    <Badge className={map[position] ?? "bg-muted text-muted-foreground"}>
      {position}
    </Badge>
  );
}

// ============================================
// MESSAGES TAB
// ============================================
function MessagesTab() {
  const conversations = useLeaderMessages((s) => s.conversations);
  const sendMessage = useLeaderMessages((s) => s.sendMessage);
  const markRead = useLeaderMessages((s) => s.markRead);

  const [activeId, setActiveId] = React.useState(conversations[0]?.id ?? "");
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const [draft, setDraft] = React.useState("");

  const send = () => {
    if (!draft.trim() || !activeId) return;
    sendMessage(activeId, draft.trim());
    setDraft("");
    toast.success("پیام ارسال شد");
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    markRead(id);
  };

  if (!active) {
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-bold">پیام‌ها</h3>
        <Card className="rounded-3xl border-border/60 bg-card p-10 text-center text-muted-foreground">
          گفتگویی وجود ندارد.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold">پیام‌ها</h3>
        <p className="text-sm text-muted-foreground">گفتگو با مسافران شما</p>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Conversation list */}
          <div className="border-b border-border/60 md:border-b-0 md:border-l">
            <div className="border-b border-border/60 p-3 text-xs font-medium text-muted-foreground">
              گفتگوها ({toFa(conversations.length)})
            </div>
            <div className="custom-scroll max-h-80 overflow-y-auto md:max-h-[520px]">
              {conversations.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/40 p-3 text-right transition-colors ${
                      isActive ? "bg-emerald/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <SmartImage
                      src={c.avatar}
                      alt={c.name}
                      fallback="avatar"
                      shimmer={false}
                      aspectClass="size-10 shrink-0 rounded-full"
                      className="h-full w-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-semibold">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {c.last}
                      </div>
                    </div>
                    {c.unread > 0 && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sunset text-[10px] font-bold text-cream">
                        {toFa(c.unread)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat view */}
          <div className="flex h-[440px] md:h-[560px] flex-col">
            <div className="flex items-center gap-3 border-b border-border/60 p-3">
              <SmartImage
                src={active.avatar}
                alt={active.name}
                fallback="avatar"
                shimmer={false}
                aspectClass="size-9 shrink-0 rounded-full"
                className="h-full w-full object-cover"
              />
              <div>
                <div className="text-sm font-semibold">{active.name}</div>
                <div className="text-[10px] text-emerald">آنلاین</div>
              </div>
            </div>

            <div className="custom-scroll flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
              {active.messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.from === "me" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "me"
                        ? "bg-emerald text-cream rounded-bl-md"
                        : "bg-card border border-border/60 rounded-br-md"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div
                      className={`mt-1 text-[9px] ${
                        m.from === "me" ? "text-cream/70" : "text-muted-foreground"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="پیام خود را بنویسید..."
                className="bg-background"
              />
              <Button onClick={send} className="bg-primary text-primary-foreground max-sm:size-11" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
