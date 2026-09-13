"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Star,
  ShieldCheck,
  MapPin,
  Languages,
  Phone,
  Mountain,
  Briefcase,
  ThumbsUp,
  TrendingUp,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  Sparkles,
  Award,
  Send,
  Copy,
  Crown,
  Edit3,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useGo } from "@/lib/use-go";
import { useViewParams } from "@/lib/use-view-params";
import { leaders, getLeader } from "@/mocks/leaders";
import { getToursByLeader } from "@/mocks/tours";
import { useAuth } from "@/store/auth-store";
import { useLeaderMessages } from "@/store/leader-messages-store";
import { useLeaderProfile } from "@/store/leader-profile-store";
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
import { getLeaderTier } from "@/lib/leader-tiers";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";
import { TiltCard } from "@/components/animations/tilt-card";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// --- Recharts custom tooltip (RTL) ---
function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    // dir="rtl" — the chart container is dir="ltr" (recharts needs it);
    // without this the «۴.۵ از ۵» value reads visually reversed for a
    // Persian reader (از ۵ ۴.۵).
    <div dir="rtl" className="glass rounded-xl border border-border/60 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-foreground">{label}</div>
      <div className="mt-0.5 flex items-center gap-1 text-emerald">
        <span className="font-bold">{toFa(payload[0].value)}</span>
        <span>{unit}</span>
      </div>
    </div>
  );
}

export function LeaderProfileView() {
  const go = useGo();
  const params = useViewParams();
  const id = params.id ?? "l1";
  const { user } = useAuth();
  const isMe = !!user && user.id === id;

  // Safe lookup: prefer mock-leader with this id; if none and the id is the
  // logged-in user's, construct a synthetic Leader from user data; otherwise
  // fall back to `leaders[0]` so the page never crashes on an unknown id.
  const mockLeader = leaders.find((l) => l.id === id);
  const leader = React.useMemo(() => {
    if (mockLeader) return mockLeader;
    if (isMe && user) {
      const fallback = getLeader("l1"); // use l1 as template for trends/specialties
      return {
        ...fallback,
        id: user.id,
        fullName: user.fullName,
        avatar:
          user.avatar ??
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80",
        bio: "لیدر تور کوچ‌نشین — پروفایل در حال تکمیل است.",
        toursCount: 0,
      };
    }
    return getLeader(id);
  }, [mockLeader, isMe, user, id]);

  const activeTours = id ? getToursByLeader(leader.id) : [];

  // Pro plan status (per-leader, persisted).
  const isPro = useLeaderProfile((s) => s.isPro(leader.id));
  // ویرایش پروفایل عمومی توسط خودِ لیدر (v25) — merge روی دادهٔ پایه.
  const profileEdit = useLeaderProfile((s) => s.profileEdits[id]);
  const setProfileEdit = useLeaderProfile((s) => s.setProfileEdit);
  const displayLeader = React.useMemo(() => {
    if (!leader) return leader;
    if (!profileEdit) return leader;
    return {
      ...leader,
      fullName: profileEdit.fullName?.trim() || leader.fullName,
      bio: profileEdit.bio?.trim() || leader.bio,
      specialties: profileEdit.specialties?.length ? profileEdit.specialties : leader.specialties,
      languages: profileEdit.languages?.length ? profileEdit.languages : leader.languages,
    };
  }, [leader, profileEdit]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    fullName: "",
    bio: "",
    specialties: "",
    languages: "",
  });

  // "Message to leader" dialog state.
  const startConversation = useLeaderMessages((s) => s.startConversation);
  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState("");
  // "Call leader" dialog state — a real modal with a tappable tel: link.
  const [callOpen, setCallOpen] = React.useState(false);
  // Deterministic mock phone per leader (demo platform has no real numbers).
  const leaderIdForPhone = leader?.id ?? "l1";
  const leaderPhone = React.useMemo(() => {
    let hash = 0;
    for (const ch of leaderIdForPhone) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
    return `0912 ${String(200 + (hash % 700))} ${String(1000 + (hash % 9000))}`;
  }, [leaderIdForPhone]);

  const sendMessage = () => {
    const trimmed = msgText.trim();
    if (!trimmed) return;
    const fromName = user?.fullName ?? "مسافر ناشناس";
    const fromAvatar =
      user?.avatar ??
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop&crop=faces&q=80";
    startConversation(leader.id, { name: fromName, avatar: fromAvatar }, trimmed);
    setMsgText("");
    setMsgOpen(false);
    toast.success("پیام شما ارسال شد", {
      description: `${L.fullName} می‌تواند در تب «پیام‌ها» پاسخ دهد.`,
    });
  };

  if (!leader) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 pt-28 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-muted text-muted-foreground">
          <Mountain className="h-9 w-9" />
        </div>
        <h2 className="text-2xl font-bold">لیدر یافت نشد</h2>
        <p className="text-muted-foreground">
          ممکن است پروفایل حذف شده باشد یا آدرس اشتباه باشد.
        </p>
        <Button onClick={() => go("tours")} className="bg-primary text-primary-foreground">
          بازگشت به تورها
        </Button>
      </div>
    );
  }

  // پس از گارد، لیدر قطعاً موجود است — از این‌جا به بعد نسخهٔ نمایشی (merge‌شده
  // با ویرایش‌های خود لیدر) استفاده می‌شود.
  const L = displayLeader;
  const tier = getLeaderTier(L);

  const openEdit = () => {
    setEditForm({
      fullName: L.fullName,
      bio: L.bio,
      specialties: L.specialties.join("، "),
      languages: L.languages.join("، "),
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    const splitList = (s: string) =>
      s
        .split(/[،,]/)
        .map((x) => x.trim())
        .filter(Boolean);
    setProfileEdit(id, {
      fullName: editForm.fullName.trim(),
      bio: editForm.bio.trim(),
      specialties: splitList(editForm.specialties),
      languages: splitList(editForm.languages),
    });
    setEditOpen(false);
    toast.success("پروفایل عمومی به‌روزرسانی شد");
  };

  const ratingData = leader.recentRatingTrend.map((d) => ({
    month: d.month,
    rating: d.rating,
  }));
  const bookingData = leader.bookingTrend.map((d) => ({
    month: d.month,
    bookings: d.bookings,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-emerald via-emerald-dark to-forest" />
        <div className="absolute inset-0 bg-noise opacity-[0.18] mix-blend-overlay" />
        {/* decorative blobs */}
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-emerald-light/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-32 md:px-6 md:pt-36">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 -m-2 rounded-[2rem] bg-gold/40 blur-xl" />
              <SmartImage
                src={L.avatar}
                alt={L.fullName}
                fallback="avatar"
                shimmer={false}
                aspectClass="relative h-32 w-32 rounded-3xl ring-2 ring-gold md:h-44 md:w-44"
                className="h-full w-full object-cover"
              />
              <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-forest shadow-lg">
                <ShieldCheck className="h-3.5 w-3.5" />
                لیدر تایید شده
              </span>
            </motion.div>

            {/* Name + meta */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 text-cream"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-gold/40 bg-gold/15 text-gold backdrop-blur">
                  <Award className="h-3 w-3" />
                  رتبه برتر
                </Badge>
                {/* سطح‌بندی لیدر (v25) */}
                <Badge className={cn("backdrop-blur", tier.badgeClass)}>
                  <span aria-hidden>{tier.icon}</span>
                  سطح {toFa(tier.level)} — {tier.label}
                </Badge>
                <Badge className="border-cream/20 bg-cream/10 text-cream backdrop-blur">
                  <MapPin className="h-3 w-3" />
                  ایران
                </Badge>
                {isPro && (
                  <Badge className="border-sunset/40 bg-sunset/20 text-gold backdrop-blur">
                    <Crown className="h-3 w-3" />
                    حرفه‌ای
                  </Badge>
                )}
              </div>
              <h1 className="mb-3 text-3xl font-extrabold md:text-5xl">
                {L.fullName}
              </h1>
              <p className="mb-4 max-w-2xl text-sm text-cream/80 md:text-base">
                {L.bio}
              </p>
              {/* specialties */}
              <div className="mb-3 flex flex-wrap gap-2">
                {L.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-cream/20 bg-cream/5 px-3 py-1 text-xs text-cream/90 backdrop-blur"
                  >
                    <Sparkles className="h-3 w-3 text-gold" />
                    {s}
                  </span>
                ))}
              </div>
              {/* languages */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-cream/80">
                <span className="inline-flex items-center gap-1">
                  <Languages className="h-4 w-4 text-gold" />
                  زبان‌ها:
                </span>
                {L.languages.map((l, i) => (
                  <span key={l}>
                    {l}
                    {i < L.languages.length - 1 && (
                      <span className="mx-2 text-cream/30">•</span>
                    )}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="shrink-0"
            >
              <div className="flex flex-col gap-2">
                <MagneticButton as="div">
                  <Button
                    size="lg"
                    onClick={() => setCallOpen(true)}
                    className="bg-gold text-forest hover:bg-gold-light"
                  >
                    <Phone className="h-4 w-4" />
                    تماس با لیدر
                  </Button>
                </MagneticButton>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setMsgOpen(true)}
                  className="border-cream/30 bg-cream/5 text-cream backdrop-blur hover:bg-cream/15"
                >
                  <Send className="h-4 w-4" />
                  پیام به لیدر
                </Button>
                {/* ویرایش پروفایل — فقط وقتی لیدر، پروفایل خودش را می‌بیند (v25) */}
                {isMe && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={openEdit}
                    className="border-gold/50 bg-gold/15 text-gold backdrop-blur hover:bg-gold/25"
                  >
                    <Edit3 className="h-4 w-4" />
                    ویرایش پروفایل من
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        {/* wave divider */}
        <svg
          className="absolute -bottom-px left-0 w-full text-background"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,40 C240,80 480,80 720,50 C960,20 1200,20 1440,50 L1440,80 L0,80 Z"
          />
        </svg>
      </div>

      {/* ===== STATS ROW ===== */}
      <section className="mx-auto -mt-6 max-w-7xl px-4 md:px-6">
        <ScrollReveal>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard
              icon={<Star className="h-5 w-5" />}
              tint="gold"
              label="امتیاز کلی"
              value={L.rating}
              suffix=""
              format={(n) => toFa(n.toFixed(1))}
              decimals={1}
              hint="از ۵"
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              tint="emerald"
              label="تورهای برگزار شده"
              value={L.toursCount}
              hint="در طول فعالیت"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              tint="sunset"
              label="سال‌های تجربه"
              value={L.experienceYears}
              hint="حرفه‌ای"
            />
            <StatCard
              icon={<ThumbsUp className="h-5 w-5" />}
              tint="emerald-light"
              label="رضایت مسافران"
              value={L.satisfaction}
              suffix="٪"
              hint="بر اساس نظرات"
            />
          </div>
        </ScrollReveal>
      </section>

      {/* ===== BIO + CHARTS ===== */}
      <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bio */}
          <ScrollReveal className="lg:col-span-1">
            <Card className="h-full rounded-3xl border-border/60 bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald/10 text-emerald">
                  <Mountain className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold">درباره لیدر</h3>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{L.bio}</p>
              <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">وضعیت تاییدیه</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald">
                    <ShieldCheck className="h-4 w-4" /> تایید شده
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">تعداد زبان</span>
                  <span className="font-semibold">{toFa(L.languages.length)} زبان</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">تخصص‌ها</span>
                  <span className="font-semibold">{toFa(L.specialties.length)} حوزه</span>
                </div>
              </div>
              {/* سطح لیدر + پیشرفت تا سطح بعد (v25) */}
              <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/5 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-gold">
                    <span aria-hidden>{tier.icon}</span>
                    سطح {toFa(tier.level)}: {tier.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{tier.description}</span>
                </div>
                <Progress value={tier.progressToNext} className="h-1.5 bg-muted" />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {tier.nextLabel
                    ? `${toFa(tier.pointsToNext ?? 0)} امتیاز دیگر تا سطح «${tier.nextLabel}»`
                    : "بالاترین سطح ممکن — درخشیدی!"}
                </p>
              </div>
            </Card>
          </ScrollReveal>

          {/* Rating trend AreaChart */}
          <ScrollReveal delay={0.1} className="lg:col-span-1">
            <Card className="h-full rounded-3xl border-border/60 bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">روند امتیاز ۶ ماه اخیر</h3>
                  <p className="text-xs text-muted-foreground">میانگین امتیاز دریافتی در هر ماه</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-emerald/10 text-emerald">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="h-44 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratingData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[4, 5]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<ChartTooltip unit="از ۵" />} />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="var(--chart-1)"
                      strokeWidth={3}
                      fill="url(#ratingGrad)"
                      dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </ScrollReveal>

          {/* Booking trend BarChart */}
          <ScrollReveal delay={0.2} className="lg:col-span-1">
            <Card className="h-full rounded-3xl border-border/60 bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">رزروهای ماهانه</h3>
                  <p className="text-xs text-muted-foreground">تعداد رزرو در ۶ ماه اخیر</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-sunset/10 text-sunset">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <div className="h-44 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<ChartTooltip unit="رزرو" />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="bookings" radius={[6, 6, 0, 0]} maxBarSize={28}>
                      {bookingData.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? "var(--chart-2)" : "var(--chart-5)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== ACTIVE TOURS ===== */}
      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-6">
        <ScrollReveal>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">تورهای فعال این لیدر</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {toFa(activeTours.length)} تور در حال برگزاری
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => go("tours")}
              className="hidden text-emerald md:inline-flex"
            >
              مشاهده همه
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </ScrollReveal>

        {activeTours.length === 0 ? (
          <Card className="rounded-3xl p-10 text-center text-muted-foreground">
            این لیدر در حال حاضر تور فعالی ندارد.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeTours.map((tour, i) => (
              <ScrollReveal key={tour.id} delay={i * 0.06}>
                <TiltCard className="h-full" max={6}>
                  <div
                    onClick={() => go("tour-detail", { id: tour.id })}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <SmartImage
                        src={tour.images[0]}
                        alt={tour.title}
                        fallback="tour"
                        fallbackLabel={CATEGORY_LABELS[tour.category]}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent" />
                      <div className="absolute right-3 top-3 flex flex-col gap-1">
                        <Badge className="border-gold/30 bg-gold/90 text-forest">
                          <Star className="h-3 w-3 fill-current" />
                          {toFa(tour.rating.toFixed(1))}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-cream">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {tour.destination}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {toFa(tour.duration)} روز
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-emerald/10 text-emerald">
                          {CATEGORY_LABELS[tour.category]}
                        </Badge>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          {DIFFICULTY_LABELS[tour.difficulty]}
                        </Badge>
                      </div>
                      <h3 className="mb-2 line-clamp-2 font-bold leading-7 transition-colors group-hover:text-emerald">
                        {tour.title}
                      </h3>
                      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {toPersianShortDate(tour.startDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {toFa(tour.reservedCount)}/{toFa(tour.capacity)} نفر
                        </span>
                      </div>
                      {/* capacity bar */}
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>ظرفیت پر شده</span>
                          <span>
                            {toFa(Math.round((tour.reservedCount / tour.capacity) * 100))}٪
                          </span>
                        </div>
                        <Progress
                          value={(tour.reservedCount / tour.capacity) * 100}
                          className="h-1.5 bg-muted"
                        />
                      </div>
                      <div className="mt-auto flex items-end justify-between">
                        <div>
                          {tour.discountPrice ? (
                            <>
                              <div className="text-[11px] text-muted-foreground line-through">
                                {formatCurrency(tour.price)}
                              </div>
                              <div className="text-lg font-extrabold text-sunset">
                                {formatCurrency(tour.discountPrice)}
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-extrabold text-emerald">
                              {formatCurrency(tour.price)}
                            </div>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald transition-transform group-hover:-translate-x-1">
                          مشاهده تور
                          <ArrowLeft className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-forest via-emerald-dark to-emerald p-8 md:p-12">
            <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="text-cream">
                <h2 className="mb-2 text-2xl font-extrabold md:text-3xl">
                  آماده‌ای با {L.fullName} سفر کنی؟
                </h2>
                <p className="max-w-xl text-cream/80">
                  تورهای فعال این لیدر را ببین و تجربه‌ای امن و حرفه‌ای از طبیعت ایران داشته باش.
                </p>
              </div>
              <MagneticButton as="div">
                <Button
                  size="lg"
                  onClick={() => go("tours")}
                  className="bg-gold text-forest hover:bg-gold-light"
                >
                  سفر با این لیدر
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== MESSAGE-TO-LEADER DIALOG ===== */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>پیام به {L.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              پیام شما در تب «پیام‌ها»ی این لیدر نمایش داده می‌شود.
            </p>
            <Textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="مثلاً: سلام، برای تور دماوند سوال داشتم..."
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!msgText.trim()}
              className="bg-primary text-primary-foreground"
            >
              <Send className="h-4 w-4" />
              ارسال پیام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call dialog — the «تماس با لیدر» button opens this real modal
          (previously it only fired a toast and nothing else happened). */}
      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" />
              تماس با {L.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-gold/5 p-4">
              <SmartImage
                src={L.avatar}
                alt={L.fullName}
                fallback="avatar"
                shimmer={false}
                aspectClass="h-14 w-14 shrink-0 rounded-2xl ring-2 ring-gold/40"
                className="h-full w-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{L.fullName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  راهنمای تور • {toFa(L.experienceYears)} سال تجربه
                </p>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-muted-foreground">شماره تماس</p>
              <div className="flex items-center justify-between gap-2 rounded-2xl border bg-secondary/50 p-3">
                <span dir="ltr" className="text-lg font-extrabold tracking-wider text-foreground">
                  {leaderPhone}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl"
                  onClick={() => {
                    navigator.clipboard?.writeText(leaderPhone.replace(/\s/g, ""));
                    toast.success("شماره کپی شد");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  کپی
                </Button>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-muted-foreground">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                بهترین زمان تماس: ۹ صبح تا ۹ شب — در غیر این صورت پیام بگذارید.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setCallOpen(false)} className="flex-1">
              بستن
            </Button>
            <Button
              onClick={() => {
                window.location.href = `tel:${leaderPhone.replace(/\s/g, "")}`;
                setCallOpen(false);
              }}
              className="flex-1 gap-2 bg-gold text-forest hover:bg-gold-light"
            >
              <Phone className="h-4 w-4" />
              تماس
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT-PROFILE DIALOG (v25) — وقتی لیدر پروفایل خودش را می‌بیند ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-gold" />
              ویرایش پروفایل عمومی
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              تغییرات همین‌جا ذخیره می‌شود و در پروفایل عمومی شما برای همه نمایش داده می‌شود.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">نام و نام خانوادگی</label>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-gold focus:outline-none"
                placeholder="مثلاً: سینا رستمی"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">درباره من (بیو)</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder="معرفی کوتاه خود و تجربه‌هایتان..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                تخصص‌ها <span className="font-normal">(با ویرگول جدا کنید)</span>
              </label>
              <input
                value={editForm.specialties}
                onChange={(e) => setEditForm((f) => ({ ...f, specialties: e.target.value }))}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-gold focus:outline-none"
                placeholder="کوهنوردی ارتفاع، صعود زمستانی"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                زبان‌ها <span className="font-normal">(با ویرگول جدا کنید)</span>
              </label>
              <input
                value={editForm.languages}
                onChange={(e) => setEditForm((f) => ({ ...f, languages: e.target.value }))}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-gold focus:outline-none"
                placeholder="فارسی، انگلیسی"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">
              انصراف
            </Button>
            <Button
              onClick={saveEdit}
              disabled={!editForm.fullName.trim() || !editForm.bio.trim()}
              className="flex-1 gap-2 bg-gold text-forest hover:bg-gold-light"
            >
              <Check className="h-4 w-4" />
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Stat card =====
function StatCard({
  icon,
  label,
  value,
  tint,
  suffix = "",
  format,
  decimals,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: "emerald" | "gold" | "sunset" | "emerald-light";
  suffix?: string;
  format?: (n: number) => string;
  /** ارقام اعشار — فقط برای آمارهایی مثل امتیاز کلی (۱ رقم). */
  decimals?: number;
  hint?: string;
}) {
  const tintMap = {
    emerald: "bg-emerald/10 text-emerald",
    gold: "bg-gold/15 text-gold",
    sunset: "bg-sunset/10 text-sunset",
    "emerald-light": "bg-emerald-light/10 text-emerald-light",
  };
  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tintMap[tint]}`}>
          {icon}
        </span>
        {hint && (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-foreground">
        <Counter to={value} format={format} suffix={suffix} decimals={decimals} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
