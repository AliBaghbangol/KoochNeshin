"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  Heart,
  Settings,
  Star,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  Download,
  Bell,
  MapPin,
  ShoppingBag,
  HeartCrack,
  UserCircle,
  Lock,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Trash2,
  Eye,
  Tag,
  Info,
  CheckCheck,
  Check,
  X,
  MessageSquare,
  Shield,
  Radio,
} from "lucide-react";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useWishlist } from "@/store/wishlist-store";
import { useUserPrefs } from "@/store/user-prefs-store";
import { useNotifications } from "@/store/notifications-store";
import { useBookings } from "@/store/bookings-store";
import { useOrders } from "@/store/orders-store";
import {
  OrderDetailsDialog,
  type OrderDetailsData,
} from "@/components/views/order-details-dialog";
import { tours } from "@/mocks/tours";
import { equipment } from "@/mocks/equipment";
import {
  toFa,
  formatCurrency,
  toPersianDate,
  toPersianShortDate,
  daysUntil,
  timeAgo,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";
import { TiltCard } from "@/components/animations/tilt-card";
import { SmartImage } from "@/components/common/smart-image";
import { CalendarTab } from "@/components/user/calendar-tab";
import { DnaDashboardSection } from "@/components/dna/dna-dashboard-section";
import { XpBar } from "@/components/rewards/xp-bar";
import { AchievementGrid } from "@/components/rewards/achievement-grid";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { QuickStatsWidget } from "@/components/dashboard/quick-stats-widget";
import { useTripRoom } from "@/store/trip-room-store";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { BookingStatus } from "@/types";

type TabKey = "overview" | "bookings" | "calendar" | "orders" | "wishlist" | "notifications" | "settings";

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { key: "bookings", label: "رزروهای من", icon: CalendarCheck },
  { key: "calendar", label: "تقویم", icon: Calendar },
  { key: "orders", label: "سفارش‌های تجهیزات", icon: Package },
  { key: "wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
  { key: "notifications", label: "اعلان‌ها", icon: Bell },
  { key: "settings", label: "تنظیمات حساب", icon: Settings },
];

// ===== Mock data =====
interface MockBooking {
  id: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  tourDate: string;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
  leader: string;
  /** Mirrors UserBooking.completedAt — real bookings get it stamped by
   *  completeBooking(); mock seeds simply have it undefined. */
  completedAt?: string;
}

const MOCK_BOOKINGS: MockBooking[] = [
  { id: "ub1", tourId: "t1", tourTitle: "صعود فصلی قله دماوند از مسیر جنوبی", tourImage: tours[0].images[0], tourDate: "2025-07-12", participants: 2, totalPrice: 5500000, status: "confirmed", leader: "سینا رستمی" },
  { id: "ub2", tourId: "t9", tourTitle: "کویر دشت لوت — کمپینگ ستاره‌ای", tourImage: tours[8].images[0], tourDate: "2025-07-30", participants: 1, totalPrice: 2350000, status: "pending", leader: "آرش کاظمی" },
  { id: "ub3", tourId: "t13", tourTitle: "مرنجاب — کاروانسرا و دریاچه نمک", tourImage: tours[12].images[0], tourDate: "2025-07-23", participants: 3, totalPrice: 2970000, status: "confirmed", leader: "آرش کاظمی" },
  { id: "ub4", tourId: "t4", tourTitle: "جنگل ابر — طبیعت‌گردی مه‌آلود", tourImage: tours[3].images[0], tourDate: "2025-06-15", participants: 2, totalPrice: 3200000, status: "cancelled", leader: "نگار محمدی" },
];

interface MockOrder {
  id: string;
  items: string;
  total: number;
  date: string;
  status: "delivered" | "processing" | "returned";
}

const MOCK_ORDERS: MockOrder[] = [
  { id: "OR-1024", items: "چراغ قوه کوهنوردی + کیسه خواب", total: 1850000, date: "2025-07-01", status: "delivered" },
  { id: "OR-1025", items: "کفش کوهنوردی نایک (اجاره)", total: 450000, date: "2025-07-08", status: "processing" },
  { id: "OR-1018", items: "کاپشن ضدآب + دستکش", total: 2300000, date: "2025-06-22", status: "delivered" },
  { id: "OR-1015", items: "چادر کمپینگ دو نفره", total: 3900000, date: "2025-06-10", status: "returned" },
];

// Default wishlist seeds for first-time users (applied via store hydration in effect below)
const DEFAULT_WISHLIST_SEED = ["t2", "t6", "t12"];

// Mock activities feed
const ACTIVITIES = [
  { icon: CalendarCheck, tint: "emerald", text: "رزرو تور «صعود قله دماوند» تأیید شد", time: "۲ ساعت پیش" },
  { icon: Package, tint: "gold", text: "سفارش تجهیزات OR-1024 ارسال شد", time: "۵ ساعت پیش" },
  { icon: Star, tint: "sunset", text: "به تور «مرنجاب» امتیاز ۵ دادید", time: "دیروز" },
  { icon: Heart, tint: "emerald-light", text: "تور «کندوان» را به علاقه‌مندی‌ها اضافه کردید", time: "۲ روز پیش" },
];

export function UserDashboardView() {
  const { isAuthenticated, user } = useAuth();
  const go = useGo();
  const { setAuthOpen } = useNav();
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");

  /* Deep-link scroll: on tablet/mobile the welcome banner + Travel-DNA quiz
     fill the whole first viewport, so the tab content the user asked for
     (e.g. «پروفایل من» → settings) opens BELOW the fold — literally outside
     the viewport. We remember the deep-link and smooth-scroll the content
     column into view right after the first paint. */
  const contentRef = React.useRef<HTMLDivElement>(null);
  const deepLinkedRef = React.useRef(false);

  // Deep-link support: /dashboard?tab=settings opens that tab directly
  // (navbar «پروفایل من» lands here). Read once on mount — avoids
  // useSearchParams/Suspense complexities entirely.
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && NAV_ITEMS.some((i) => i.key === t)) {
      setActiveTab(t as TabKey);
      deepLinkedRef.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (!deepLinkedRef.current) return;
    deepLinkedRef.current = false;
    // Wait for the tab content to mount + reveal animations to register.
    const id = window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  // Tab switch keeps the URL in sync (replaceState — no history spam),
  // so refresh/back keeps the user on the same tab.
  const switchTab = React.useCallback((k: TabKey) => {
    setActiveTab(k);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", k);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* noop */
    }
  }, []);
  const wishlistCount = useWishlist((s) => s.tourIds.length);
  const wishlistTourIds = useWishlist((s) => s.tourIds);
  const addWishlist = useWishlist((s) => s.add);

  // Hooks must be called unconditionally (before any early return).
  const userBookings = useBookings((s) => s.bookings);
  const userOrders = useOrders((s) => s.orders);

  // Seed default wishlist for first-time users (so dashboard isn't empty)
  React.useEffect(() => {
    if (isAuthenticated && wishlistTourIds.length === 0) {
      DEFAULT_WISHLIST_SEED.forEach((id) => addWishlist(id));
    }
  }, [isAuthenticated, wishlistTourIds.length, addWishlist]);

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-[80vh] overflow-hidden pt-28">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald/5 to-background" />
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-16 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-emerald/10 text-emerald">
            <Lock className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold md:text-3xl">ورود به داشبورد</h2>
          <p className="text-muted-foreground">
            برای مشاهده رزروها، سفارش‌ها و علاقه‌مندی‌های خود، ابتدا وارد حساب کاربری‌تان شوید.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => setAuthOpen(true)} className="bg-primary text-primary-foreground">
              ورود / ثبت‌نام
            </Button>
            <Button size="lg" variant="outline" onClick={() => go("home")}>
              بازگشت به خانه
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.fullName ?? "مسافر گرامی";
  const firstName = displayName.split(" ")[0];
  // Merge real user bookings/orders with mock seeds for the overview stats
  const allBookings = [...userBookings, ...MOCK_BOOKINGS];
  const allOrders = [...userOrders, ...MOCK_ORDERS];
  const bookingsCount = allBookings.length;
  const ordersCount = allOrders.length;
  const confirmedBookings = allBookings.filter((b) => b.status === "confirmed");

  // Find next upcoming tour (closest date in future)
  const nextBooking = confirmedBookings
    .filter((b) => new Date(b.tourDate) > new Date())
    .sort((a, b) => new Date(a.tourDate).getTime() - new Date(b.tourDate).getTime())[0];

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* ===== Welcome header ===== */}
        <ScrollReveal>
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-bl from-forest via-emerald-dark to-emerald p-6 md:p-8">
            <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-emerald-light/20 blur-3xl" />
            <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-2xl ring-2 ring-gold md:h-20 md:w-20">
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={displayName} />
                  ) : (
                    <AvatarFallback className="rounded-2xl bg-gold/20 text-2xl font-bold text-gold">
                      {firstName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-cream">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className="border-gold/30 bg-gold/15 text-gold">
                      <Sparkles className="h-3 w-3" />
                      مسافر فعال
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-extrabold md:text-3xl">
                    سلام، {displayName} 👋
                  </h1>
                  <p className="mt-1 text-sm text-cream/80">
                    عضو کوچ‌نشین از ۱ خرداد ۱۴۰۴
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <QuickStat value={bookingsCount} label="تور رزرو شده" icon={<CalendarCheck className="h-4 w-4" />} />
                <QuickStat value={ordersCount} label="سفارش تجهیزات" icon={<ShoppingBag className="h-4 w-4" />} />
                <QuickStat value={wishlistCount} label="علاقه‌مندی" icon={<Heart className="h-4 w-4" />} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ===== Travel DNA (v19) — کوییز/کارت نتیجه ===== */}
        <DnaDashboardSection />

        {/* Content anchor — deep-linked tabs (پروفایل من / داشبورد من) scroll
            here so the requested section is inside the viewport on tablet/mobile */}
        <div ref={contentRef} className="scroll-mt-24 md:scroll-mt-28">
        {/* Mobile tabs */}
        <div className="mb-6 md:hidden">
          <div className="custom-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => switchTab(item.key)}
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
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
                      onClick={() => switchTab(item.key)}
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
                      {active && <ArrowLeft className="h-4 w-4" />}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-3 rounded-2xl bg-gradient-to-bl from-gold/15 to-sunset/10 p-4">
                <Bell className="mb-2 h-5 w-5 text-gold" />
                <p className="text-xs leading-5 text-foreground/80">
                  اعلان‌های جدید را فعال کن تا از تخفیف‌های ویژه باخبر بشی.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full border-gold/40 text-gold hover:bg-gold/10"
                  onClick={() => switchTab("settings")}
                >
                  تنظیم اعلان‌ها
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
                {activeTab === "overview" && (
                  <OverviewTab
                    nextBooking={nextBooking}
                    bookingsCount={bookingsCount}
                    ordersCount={ordersCount}
                    wishlistCount={wishlistCount}
                    onSeeTours={() => go("tours")}
                  />
                )}
                {activeTab === "overview" && <CommunityHubSection />}
                {activeTab === "overview" && (
                  <div className="mt-8">
                    <QuickStatsWidget />
                  </div>
                )}
                {activeTab === "bookings" && <BookingsTab />}
                {activeTab === "calendar" && <CalendarTab />}
                {activeTab === "orders" && <OrdersTab />}
                {activeTab === "wishlist" && <WishlistTab />}
                {activeTab === "notifications" && <NotificationsTab />}
                {activeTab === "settings" && <SettingsTab name={displayName} phone={user?.phone ?? ""} email={user?.email ?? ""} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        </div>
      </div>
    </div>
  );
}

// ===== Welcome quick stat =====
function QuickStat({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cream/15 bg-cream/10 p-3 text-center text-cream backdrop-blur">
      <div className="mb-1 flex items-center justify-center text-gold">{icon}</div>
      <div className="text-xl font-extrabold">
        <Counter to={value} />
      </div>
      <div className="text-[10px] text-cream/70">{label}</div>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({
  nextBooking,
  bookingsCount,
  ordersCount,
  wishlistCount,
  onSeeTours,
}: {
  nextBooking?: MockBooking;
  bookingsCount: number;
  ordersCount: number;
  wishlistCount: number;
  onSeeTours: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* XP progress (v19) */}
      <XpBar />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <KpiCard
          icon={<CalendarCheck className="h-5 w-5" />}
          tint="emerald"
          label="تورهای رزرو شده"
          value={bookingsCount}
          sub={`${toFa(MOCK_BOOKINGS.filter((b) => b.status === "confirmed").length)} تور تأیید شده`}
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5" />}
          tint="gold"
          label="سفارش‌های تجهیزات"
          value={ordersCount}
          sub={`${toFa(MOCK_ORDERS.filter((o) => o.status === "delivered").length)} تحویل شده`}
        />
        <KpiCard
          icon={<Heart className="h-5 w-5" />}
          tint="sunset"
          label="علاقه‌مندی‌ها"
          value={wishlistCount}
          sub="تورهای ذخیره شده"
        />
      </div>

      {/* Achievements (v19) */}
      <AchievementGrid />

      {/* Next tour countdown + activity feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Next tour */}
        <Card className="relative overflow-hidden rounded-3xl border-border/60 bg-card p-0 lg:col-span-3">
          {nextBooking ? (
            <NextTourCard booking={nextBooking} onSeeTours={onSeeTours} />
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-bold">شما تور تأیید شده‌ای در آینده ندارید</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                همین حالا یک ماجراجویی جدید پیدا کنید!
              </p>
              <Button onClick={onSeeTours} className="mt-4 bg-primary text-primary-foreground">
                مشاهده تورها
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Activity feed */}
        <Card className="rounded-3xl border-border/60 bg-card p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold">فعالیت‌های اخیر</h3>
          <div className="space-y-3">
            {ACTIVITIES.map((a, i) => {
              const Icon = a.icon;
              const tintMap: Record<string, string> = {
                emerald: "bg-emerald/10 text-emerald",
                gold: "bg-gold/15 text-gold",
                sunset: "bg-sunset/10 text-sunset",
                "emerald-light": "bg-emerald-light/10 text-emerald-light",
              };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${tintMap[a.tint]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-6">{a.text}</div>
                    <div className="text-[10px] text-muted-foreground">{a.time}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NextTourCard({ booking, onSeeTours }: { booking: MockBooking; onSeeTours: () => void }) {
  const go = useGo();
  const days = daysUntil(booking.tourDate);
  const tour = tours.find((t) => t.id === booking.tourId);

  return (
    <div className="relative">
      <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[2/1]">
        <SmartImage src={booking.tourImage} alt={booking.tourTitle} fallback="tour" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/40 to-transparent" />
        {/* countdown badge */}
        <div className="absolute left-4 top-4 rounded-2xl bg-gold px-4 py-2 text-forest shadow-lg">
          <div className="text-[10px] font-medium">شمارش معکوس</div>
          <div className="flex items-baseline gap-1 text-2xl font-extrabold">
            {toFa(days)}
            <span className="text-xs">روز</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Badge className="mb-2 bg-emerald/10 text-emerald">
          <Calendar className="h-3 w-3" />
          تور بعدی شما
        </Badge>
        <h3 className="mb-2 text-xl font-bold">{booking.tourTitle}</h3>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {toPersianDate(booking.tourDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {toFa(booking.participants)} نفر
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {tour?.destination}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => go("tour-detail", { id: booking.tourId })} className="bg-primary text-primary-foreground">
            مشاهده تور
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("بلیت دانلود شد", { description: `شماره رزرو: ${booking.id}` })}
          >
            <Download className="h-4 w-4" />
            دانلود بلیت
          </Button>
          <Button variant="ghost" onClick={onSeeTours} className="text-emerald">
            تورهای دیگر
          </Button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tint,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: "emerald" | "gold" | "sunset" | "emerald-light";
  sub?: string;
}) {
  const tintMap = {
    emerald: "bg-emerald/10 text-emerald",
    gold: "bg-gold/15 text-gold",
    sunset: "bg-sunset/10 text-sunset",
    "emerald-light": "bg-emerald-light/10 text-emerald-light",
  };
  return (
    <Card className="rounded-2xl border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tintMap[tint]}`}>
          {icon}
        </span>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </div>
      <div className="text-3xl font-extrabold tracking-tight">
        <Counter to={value} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

// ============================================
// BOOKINGS TAB
// ============================================
function BookingsTab() {
  const go = useGo();
  const [filter, setFilter] = React.useState<"all" | BookingStatus>("all");
  const userBookings = useBookings((s) => s.bookings);
  const cancelBooking = useBookings((s) => s.cancelBooking);

  // Merge real user bookings (top) with mock seed bookings (bottom)
  const allBookings = [...userBookings, ...MOCK_BOOKINGS];
  const filtered = allBookings.filter((b) => filter === "all" || b.status === filter);

  const handleCancel = (id: string) => {
    cancelBooking(id);
    toast.success("رزرو لغو شد", { description: `شماره رزرو: ${id}` });
  };

  const handleDownloadTicket = (b: typeof allBookings[number]) => {
    // Generate a simple text-based "ticket" file and trigger download
    const ticketContent = [
      "═══════════════════════════════════════",
      "           بلیت تور کوچ‌نشین            ",
      "═══════════════════════════════════════",
      "",
      `شماره رزرو: ${b.id}`,
      `نام تور: ${b.tourTitle}`,
      `تاریخ: ${toPersianDate(b.tourDate)}`,
      `تعداد مسافر: ${toFa(b.participants)} نفر`,
      `لیدر: ${b.leader}`,
      `مبلغ: ${formatCurrency(b.totalPrice)}`,
      `وضعیت: ${b.status === "confirmed" ? "تأیید شده" : b.status === "pending" ? "در انتظار" : "لغو شده"}`,
      "",
      "═══════════════════════════════════════",
      "     کوچ‌نشین — سفرهای تجربی ایران      ",
      "═══════════════════════════════════════",
    ].join("\n");
    const blob = new Blob([ticketContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${b.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("بلیت دانلود شد", { description: `شماره رزرو: ${b.id}` });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold">رزروهای من</h3>
          <p className="text-sm text-muted-foreground">{toFa(filtered.length)} رزرو</p>
        </div>
        <div className="flex max-sm:flex-wrap max-sm:gap-1.5 items-center gap-2">
          {(["all", "confirmed", "pending", "cancelled"] as const).map((s) => {
            const labels = { all: "همه", confirmed: "تأیید شده", pending: "در انتظار", cancelled: "لغو شده" };
            const active = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all max-sm:py-2 ${
                  active
                    ? "border-emerald bg-emerald text-cream"
                    : "border-border bg-card text-muted-foreground hover:border-emerald/40"
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((b, i) => {
          // "تازه" badge for bookings created in the last 5 minutes
          const isFresh =
            "createdAt" in b &&
            Date.now() - new Date((b as { createdAt: string }).createdAt).getTime() < 5 * 60 * 1000;
          // Can cancel only if pending or confirmed (not already cancelled)
          const canCancel = b.status === "pending" || b.status === "confirmed";
          return (
            <ScrollReveal key={b.id} delay={i * 0.05}>
              <Card className="group relative flex h-full flex-col overflow-hidden rounded-3xl border-border/60 bg-card p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
                {isFresh && (
                  <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-sunset px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                    <Sparkles className="h-3 w-3" />
                    تازه
                  </span>
                )}
                <div className="flex gap-4 p-4">
                  <div className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                    <SmartImage src={b.tourImage} alt={b.tourTitle} fallback="tour" shimmer={false} className="size-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">#{b.id}</span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <h4 className="mb-1 line-clamp-2 text-sm font-bold leading-6">{b.tourTitle}</h4>
                    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {toPersianShortDate(b.tourDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {toFa(b.participants)} نفر
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald">
                        {formatCurrency(b.totalPrice)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">لیدر: {b.leader}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 p-3 max-sm:gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 max-sm:h-11"
                    onClick={() => go("tour-detail", { id: b.tourId })}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    مشاهده تور
                  </Button>
                  {b.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-emerald max-sm:h-11"
                      onClick={() => go("trip-room", { bookingId: b.id })}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      اتاق سفر
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald max-sm:h-11"
                    onClick={() => handleDownloadTicket(b)}
                    disabled={b.status === "cancelled"}
                  >
                    <Download className="h-3.5 w-3.5" />
                    بلیت
                  </Button>
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive max-sm:h-11"
                      onClick={() => handleCancel(b.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      لغو
                    </Button>
                  )}
                </div>
              </Card>
            </ScrollReveal>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full rounded-3xl border-border/60 bg-card p-10 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
            رزرو‌ای مطابق فیلتر انتخابی ندارید.
          </Card>
        )}
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const map = {
    confirmed: { cls: "bg-emerald/10 text-emerald", label: "تأیید شده", icon: CheckCircle2 },
    pending: { cls: "bg-gold/15 text-gold", label: "در انتظار", icon: Clock },
    cancelled: { cls: "bg-destructive/10 text-destructive", label: "لغو شده", icon: XCircle },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <Badge className={cfg.cls}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ============================================
// ORDERS TAB
// ============================================
function OrdersTab() {
  const userOrders = useOrders((s) => s.orders);
  // Merge real user orders (top) with mock seed orders (bottom)
  const allOrders = [...userOrders, ...MOCK_ORDERS];
  const [detailsOrder, setDetailsOrder] = React.useState<OrderDetailsData | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold">سفارش‌های تجهیزات</h3>
        <p className="text-sm text-muted-foreground">{toFa(allOrders.length)} سفارش</p>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card p-0">
        <Table className="max-lg:min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pr-5 text-right">شماره سفارش</TableHead>
              <TableHead className="text-right">اقلام</TableHead>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allOrders.map((o) => {
              const isFresh =
                "createdAt" in o &&
                Date.now() - new Date((o as { createdAt: string }).createdAt).getTime() < 5 * 60 * 1000;
              return (
                <TableRow key={o.id} className={isFresh ? "bg-sunset/5" : ""}>
                  <TableCell className="py-3 pr-5 font-mono text-xs font-semibold">
                    {o.id}
                    {isFresh && (
                      <span className="mr-1 rounded-full bg-sunset/15 px-1.5 py-0.5 text-[9px] font-bold text-sunset">
                        تازه
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs">{o.items}</TableCell>
                  <TableCell className="text-xs">{toPersianShortDate(o.date)}</TableCell>
                  <TableCell className="text-xs font-semibold">{formatCurrency(o.total)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="relative h-8 w-8 text-muted-foreground hover:text-emerald max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        onClick={() => toast.success("فاکتور دانلود شد")}
                        title="دانلود فاکتور"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="relative h-8 w-8 text-muted-foreground hover:text-emerald focus-visible:ring-2 focus-visible:ring-primary max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        onClick={() => setDetailsOrder(o)}
                        title="جزئیات"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <OrderDetailsDialog
        order={detailsOrder}
        open={!!detailsOrder}
        onOpenChange={(o) => {
          if (!o) setDetailsOrder(null);
        }}
      />
    </div>
  );
}

function OrderStatusBadge({ status }: { status: MockOrder["status"] }) {
  const map = {
    delivered: { cls: "bg-emerald/10 text-emerald", label: "تحویل شده", icon: CheckCircle2 },
    processing: { cls: "bg-gold/15 text-gold", label: "در حال پردازش", icon: Clock },
    returned: { cls: "bg-destructive/10 text-destructive", label: "مرجوع شده", icon: AlertCircle },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <Badge className={cfg.cls}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ============================================
// WISHLIST TAB
// ============================================
function WishlistTab() {
  const go = useGo();
  const items = useWishlist((s) => s.tourIds);
  const equipItems = useWishlist((s) => s.equipmentIds);
  const removeWishlist = useWishlist((s) => s.remove);
  const removeEquipWishlist = useWishlist((s) => s.removeEquipment);
  const wishlistTours = tours.filter((t) => items.includes(t.id));
  const wishlistEquipment = equipment.filter((e) => equipItems.includes(e.id));

  const remove = (id: string) => {
    removeWishlist(id);
    toast.success("از علاقه‌مندی‌ها حذف شد");
  };
  const removeEquip = (id: string) => {
    removeEquipWishlist(id);
    toast.success("از علاقه‌مندی‌ها حذف شد");
  };

  const total = wishlistTours.length + wishlistEquipment.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">علاقه‌مندی‌ها</h3>
        <p className="text-sm text-muted-foreground">
          {toFa(total)} مورد ذخیره شده ({toFa(wishlistTours.length)} تور،{" "}
          {toFa(wishlistEquipment.length)} تجهیز)
        </p>
      </div>

      {total === 0 ? (
        <Card className="rounded-3xl border-border/60 bg-card p-12 text-center text-muted-foreground">
          <HeartCrack className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <h4 className="font-bold">لیست علاقه‌مندی شما خالی است</h4>
          <p className="mt-1 text-sm">با کلیک روی آیکون قلب، تورها و تجهیزات را برای بعد ذخیره کنید.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => go("tours")} className="bg-primary text-primary-foreground">
              کشف تورها
            </Button>
            <Button variant="outline" onClick={() => go("equipment")}>
              فروشگاه تجهیزات
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Tours wishlist */}
          {wishlistTours.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald" />
                <h4 className="font-bold text-emerald">تورها</h4>
                <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-xs font-bold text-emerald">
                  {toFa(wishlistTours.length)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {wishlistTours.map((t, i) => (
                  <ScrollReveal key={t.id} delay={i * 0.05}>
                    <TiltCard className="h-full" max={6}>
                      <div
                        onClick={() => go("tour-detail", { id: t.id })}
                        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-xl"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <SmartImage
                            src={t.images[0]}
                            alt={t.title}
                            fallback="tour"
                            fallbackLabel={CATEGORY_LABELS[t.category]}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(t.id);
                            }}
                            className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-cream/90 text-sunset shadow-md backdrop-blur transition-transform hover:scale-110"
                            title="حذف از علاقه‌مندی"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="absolute right-3 top-3">
                            <Badge className="bg-gold/90 text-forest">
                              <Star className="h-3 w-3 fill-current" />
                              {toFa(t.rating.toFixed(1))}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className="bg-emerald/10 text-emerald">
                              {CATEGORY_LABELS[t.category]}
                            </Badge>
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              {DIFFICULTY_LABELS[t.difficulty]}
                            </Badge>
                          </div>
                          <h4 className="mb-2 line-clamp-2 font-bold leading-7 group-hover:text-emerald">
                            {t.title}
                          </h4>
                          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {t.destination}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {toFa(t.duration)} روز
                            </span>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div>
                              {t.discountPrice ? (
                                <div className="text-lg font-extrabold text-sunset">
                                  {formatCurrency(t.discountPrice)}
                                </div>
                              ) : (
                                <div className="text-lg font-extrabold text-emerald">
                                  {formatCurrency(t.price)}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success("به سبد خرید اضافه شد");
                              }}
                              className="bg-primary text-primary-foreground"
                            >
                              رزرو
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          )}

          {/* Equipment wishlist */}
          {wishlistEquipment.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-sunset" />
                <h4 className="font-bold text-sunset">تجهیزات</h4>
                <span className="rounded-full bg-sunset/10 px-2 py-0.5 text-xs font-bold text-sunset">
                  {toFa(wishlistEquipment.length)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistEquipment.map((p, i) => (
                  <ScrollReveal key={p.id} delay={i * 0.04}>
                    <div
                      onClick={() => go("product-detail", { id: p.id })}
                      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <SmartImage
                          src={p.images[0]}
                          alt={p.title}
                          fallback="equipment"
                          fallbackLabel={p.brand}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEquip(p.id);
                          }}
                          className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-cream/90 text-sunset shadow-sm backdrop-blur transition-transform hover:scale-110"
                          title="حذف از علاقه‌مندی"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <p className="text-[10px] font-bold text-primary">{p.brand}</p>
                        <h5 className="mb-1 line-clamp-2 text-xs font-bold leading-5">{p.title}</h5>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald">
                            {formatCurrency(p.price)}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Star className="h-3 w-3 fill-gold text-gold" />
                            {toFa(p.rating)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================
function NotificationsTab() {
  const go = useGo();
  const notifications = useNotifications((s) => s.notifications);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const remove = useNotifications((s) => s.remove);
  const clearAll = useNotifications((s) => s.clearAll);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const filtered = React.useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    if (filter === "unread") return sorted.filter((n) => !n.read);
    return sorted;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const TYPE_ICONS = {
    discount: { icon: Tag, color: "text-sunset", bg: "bg-sunset/10" },
    booking: { icon: CalendarCheck, color: "text-emerald", bg: "bg-emerald/10" },
    review: { icon: Star, color: "text-gold", bg: "bg-gold/10" },
    system: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
    social: { icon: Users, color: "text-emerald-light", bg: "bg-emerald-light/10" },
  } as const;

  return (
    <div className="space-y-5">
      <div className="flex max-sm:flex-wrap max-sm:gap-2 items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">اعلان‌ها</h3>
          <p className="text-sm text-muted-foreground">
            {toFa(notifications.length)} اعلان ({toFa(unreadCount)} خوانده‌نشده)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              خواندن همه
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearAll();
                toast.success("همه اعلان‌ها پاک شدند");
              }}
              className="text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              پاک کردن
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { id: "all", label: "همه" },
          { id: "unread", label: "خوانده‌نشده" },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            {f.id === "unread" && unreadCount > 0 && (
              <span className="mr-1 rounded-full bg-sunset px-1.5 py-0.5 text-[10px] font-bold text-white">
                {toFa(unreadCount)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <Card className="rounded-3xl border-border/60 bg-card p-12 text-center text-muted-foreground">
          <Bell className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <h4 className="font-bold">
            {filter === "unread" ? "اعلان خوانده‌نشده نیست" : "اعلانی نیست"}
          </h4>
          <p className="mt-1 text-sm">اعلان‌های جدید اینجا نمایش داده می‌شوند.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const cfg = TYPE_ICONS[n.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "group relative flex gap-3 rounded-2xl border p-4 transition",
                  n.read
                    ? "border-border/40 bg-card/50"
                    : "border-primary/20 bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    cfg.bg,
                    cfg.color
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold">{n.title}</p>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sunset" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {n.body}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(n.time)}
                    </span>
                    {n.actionLabel && n.actionView && (
                      <button
                        onClick={() => {
                          if (!n.read) markRead(n.id);
                          go(n.actionView as never);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        {n.actionLabel} ←
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute left-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="relative grid h-6 w-6 place-items-center rounded-full bg-background text-muted-foreground transition hover:text-emerald max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                      title="خوانده‌شده"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    className="relative grid h-6 w-6 place-items-center rounded-full bg-background text-muted-foreground transition hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                    title="حذف"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [form, setForm] = React.useState({
    name,
    phone: phone || "0912*******",
    email: email || "",
  });
  const notifs = useUserPrefs((s) => s.notifs);
  const setNotifs = useUserPrefs((s) => s.setNotifs);
  const updateUser = useAuth((s) => s.updateUser);
  const [passwords, setPasswords] = React.useState({ current: "", next: "", confirm: "" });

  const save = () => {
    updateUser({ fullName: form.name, phone: form.phone, email: form.email });
    toast.success("تغییرات ذخیره شد", {
      description: "اطلاعات حساب شما به‌روزرسانی شد.",
    });
  };

  const savePassword = () => {
    if (!passwords.current || !passwords.next) {
      toast.error("رمز عبور فعلی و جدید را وارد کنید");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }
    toast.success("رمز عبور تغییر کرد");
    setPasswords({ current: "", next: "", confirm: "" });
  };

  const uploadAvatar = () => {
    toast.success("آواتار آپلود شد (شبیه‌سازی)");
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold">تنظیمات حساب</h3>
        <p className="text-sm text-muted-foreground">اطلاعات حساب خود را مدیریت کنید</p>
      </div>

      {/* Profile info */}
      <Card className="rounded-3xl border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-emerald" />
          <h4 className="font-bold">اطلاعات کاربری</h4>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-3xl ring-2 ring-gold">
            <AvatarFallback className="rounded-3xl bg-emerald/10 text-2xl font-bold text-emerald">
              {form.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" onClick={uploadAvatar}>
              <Camera className="h-4 w-4" />
              تغییر آواتار
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              فرمت‌های مجاز: JPG, PNG — حداکثر ۲MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="نام و نام خانوادگی">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-background"
            />
          </Field>
          <Field label="شماره موبایل">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-background"
              dir="ltr"
            />
          </Field>
          <Field label="ایمیل" full>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="bg-background"
              dir="ltr"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={save} className="bg-primary text-primary-foreground">
            <CheckCircle2 className="h-4 w-4" />
            ذخیره تغییرات
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="rounded-3xl border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold" />
          <h4 className="font-bold">اعلان‌ها</h4>
        </div>
        <div className="divide-y divide-border/60">
          <NotifRow
            title="یادآوری تور"
            desc="اطلاع‌رسانی نزدیک به زمان برگزاری تورهای رزرو شده"
            checked={notifs.tourReminders}
            onChange={(v) => setNotifs({ tourReminders: v })}
          />
          <NotifRow
            title="تأییدیه رزرو"
            desc="اعلان هنگام تأیید یا لغو رزروهای شما"
            checked={notifs.bookingConfirmations}
            onChange={(v) => setNotifs({ bookingConfirmations: v })}
          />
          <NotifRow
            title="تخفیف‌های ویژه"
            desc="اطلاع از کدهای تخفیف و پیشنهادهای فصلی"
            checked={notifs.discounts}
            onChange={(v) => setNotifs({ discounts: v })}
          />
          <NotifRow
            title="پاسخ به نظرات"
            desc="اعلان هنگام پاسخ لیدر به نظر شما"
            checked={notifs.reviewReplies}
            onChange={(v) => setNotifs({ reviewReplies: v })}
          />
          <NotifRow
            title="خبرنامه"
            desc="مقالات و راهنماهای سفر هفتگی"
            checked={notifs.newsletter}
            onChange={(v) => setNotifs({ newsletter: v })}
          />
          <NotifRow
            title="اعلان پیامکی"
            desc="دریافت وضعیت رزرو و سفارش از طریق پیامک"
            checked={notifs.sms}
            onChange={(v) => setNotifs({ sms: v })}
          />
        </div>
      </Card>

      {/* Password change */}
      <Card className="rounded-3xl border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock className="h-5 w-5 text-sunset" />
          <h4 className="font-bold">تغییر رمز عبور</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="رمز فعلی">
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="bg-background"
              dir="ltr"
            />
          </Field>
          <Field label="رمز جدید">
            <Input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              className="bg-background"
              dir="ltr"
            />
          </Field>
          <Field label="تکرار رمز جدید">
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="bg-background"
              dir="ltr"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={savePassword} variant="outline" className="border-emerald/40 text-emerald hover:bg-emerald/10">
            تغییر رمز
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="rounded-3xl border-destructive/30 bg-destructive/5 p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h4 className="font-bold text-destructive">منطقه خطر</h4>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          با حذف حساب کاربری، تمام رزروها و سفارش‌های شما به‌صورت دائمی پاک خواهد شد. این عمل قابل بازگشت نیست.
        </p>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => toast.error("برای حذف حساب با پشتیبانی تماس بگیرید")}
        >
          حذف حساب کاربری
        </Button>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NotifRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ===== Unused imports guard — these icons are used implicitly via type mapping =====

/**
 * Community Hub section — wires the killer loop CTAs (spec §8):
 *   Trip Room → Live Trip → Safety Center → Stories → Travel Buddy
 *
 * Renders a 2x2 / 1x4 grid of feature cards on the dashboard overview so
 * the user can discover all Part 2 features without leaving the dashboard.
 */
function CommunityHubSection() {
  const go = useGo();
  const userBookings = useBookings((s) => s.bookings);
  const confirmed = [...userBookings, ...MOCK_BOOKINGS].filter(
    (b) => b.status === "confirmed",
  );
  const completed = [...userBookings, ...MOCK_BOOKINGS].filter((b) => b.completedAt);

  // Count unread messages across all confirmed bookings' trip rooms
  const tripRooms = useTripRoom((s) => s.rooms);
  const unreadCount = React.useMemo(() => {
    let count = 0;
    confirmed.forEach((b) => {
      const room = tripRooms[b.id];
      if (!room) return;
      room.messages.forEach((m) => {
        if (m.isSystem || m.deleted || m.authorId === "me") return;
        if (!(m.readBy ?? []).includes("me")) count++;
      });
    });
    return count;
  }, [tripRooms, confirmed]);

  const cards = [
    {
      icon: MessageSquare,
      title: "اتاق سفر",
      body: "با لیدر و هم‌مسافران قبل از سفر هماهنگ کن.",
      cta: confirmed[0] ? "ورود به اتاق" : "اول رزرو کن",
      tone: "emerald" as const,
      onClick: () =>
        confirmed[0]
          ? go("trip-room", { bookingId: confirmed[0].id })
          : go("tours"),
    },
    {
      icon: Radio,
      title: "حالت زنده سفر",
      body: "موقعیت‌یابی، SOS و مسیر实时ی حین سفر.",
      cta: "ورود به حالت زنده",
      tone: "sunset" as const,
      onClick: () =>
        confirmed[0]
          ? go("live-trip", { bookingId: confirmed[0].id })
          : go("tours"),
    },
    {
      icon: Shield,
      title: "مرکز ایمنی",
      body: "امتیاز ایمنی تور + چک‌لیست + گزارش حادثه.",
      cta: "مرکز ایمنی",
      tone: "gold" as const,
      onClick: () => go("safety-center"),
    },
    {
      icon: Camera,
      title: completed.length > 0 ? "خاطرات سفرت آماده است" : "داستان‌های سفر",
      body:
        completed.length > 0
          ? `${toFa(completed.length)} سفرت منتظر انتشار است.`
          : "تجربه‌های مسافران کوچ‌نشین را ببین.",
      cta: completed.length > 0 ? "ساخت داستان" : "مشاهده داستان‌ها",
      tone: "emerald-light" as const,
      onClick: () => go("stories"),
    },
    {
      icon: Users,
      title: "هم‌سفریابی",
      body: "مسافران سازگار با Travel DNA خودت را پیدا کن.",
      cta: "هم‌سفر پیدا کن",
      tone: "accent" as const,
      onClick: () => go("buddies"),
    },
  ];

  const toneCls: Record<string, string> = {
    emerald: "bg-emerald/10 text-emerald",
    sunset: "bg-sunset/10 text-sunset",
    gold: "bg-gold/10 text-gold",
    "emerald-light": "bg-emerald-light/10 text-emerald-light",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <ScrollReveal y={12} className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold">جامعه‌ی کوچ‌نشین</h3>
        <span className="text-[11px] text-muted-foreground">
          همه‌ی ابزارهای سفرت در یک جا
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="group flex cursor-pointer flex-col gap-2 rounded-3xl border bg-card p-4 transition hover:shadow-md"
              onClick={c.onClick}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl ${toneCls[c.tone]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-bold">{c.title}</h4>
                {/* unread badge for Trip Room card */}
                {c.title === "اتاق سفر" && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                  >
                    {toFa(unreadCount)}
                  </motion.span>
                )}
              </div>
              <p className="flex-1 text-[11px] leading-5 text-muted-foreground">
                {c.body}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald transition group-hover:gap-2">
                {c.cta}
                <ArrowLeft className="h-3 w-3" />
              </span>
            </motion.div>
          );
        })}
      </div>
    </ScrollReveal>
  );
}
