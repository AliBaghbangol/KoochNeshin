"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Backpack,
  CalendarCheck,
  Dna,
  MapPin,
  PencilLine,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/store/auth-store";
import { useTripRoom } from "@/store/trip-room-store";
import { useTravelDNA } from "@/data/use-travel-dna";
import { useXP, xpSummary } from "@/store/xp-store";
import { useBookings } from "@/store/bookings-store";
import { tierForLevel } from "@/lib/xp/levels";
import { ACHIEVEMENT_RULES } from "@/lib/xp/achievement-rules";
import { toFa, toPersianDate, formatNumber } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { TravelDnaBadge } from "@/components/dna/travel-dna-badge";
import { AchievementGrid } from "@/components/rewards/achievement-grid";
import { useGo } from "@/lib/use-go";
import { useJumpTop } from "@/lib/use-jump-top";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";

/**
 * پروفایل عمومی مسافر — /u/[id] (ورژن ۲۴، بخش ۳ سند بررسی).
 *
 * - برای «خود کاربر»: DNA، سطح کاروانی، XP، تورهای تکمیل‌شده و نشان‌های
 *   واقعی از استورهای محلی خوانده می‌شود.
 * - برای بقیه (از Trip Room / Buddy): فقط اطلاعات عمومی و غیرحساس —
 *   نام، آواتار، تاریخ عضویت. هیچ شماره تماس/ایمیلی نمایش داده نمی‌شود.
 */
export function PublicProfileView() {
  const params = useParams();
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) as
    | string
    | undefined;
  // این صفحه همیشه از بالای صفحه باز می‌شود (الگوی فیکس صفحه‌ی تور).
  useJumpTop(id);
  const go = useGo();
  const me = useAuth((s) => s.user);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const rooms = useTripRoom((s) => s.rooms);

  const isMe = !!me && (id === me.id || id === "me");

  // پیدا کردن عضو در اتاق‌های گفت‌وگوی محلی (تنها منبع پروفایل دیگران)
  const member = React.useMemo(() => {
    if (isMe || !id) return undefined;
    for (const room of Object.values(rooms)) {
      if (!room) continue;
      const hit = (room.members ?? []).find((m) => m.userId === id);
      if (hit) return hit;
    }
    return undefined;
  }, [rooms, id, isMe]);

  // داده‌های «خودم» — فقط وقتی پروفایلِ خود کاربر است
  const myId = me?.id;
  const { data: dna } = useTravelDNA(isMe ? myId : undefined);
  const events = useXP((s) => s.events);
  const unlocked = useXP((s) => s.unlocked);
  const bookings = useBookings((s) => s.bookings);

  const subject = isMe
    ? {
        name: me?.fullName ?? "مسافر",
        avatar: me?.avatar,
        role: "traveler" as const,
        joinedAt: undefined as string | undefined,
      }
    : member
      ? {
          name: member.name,
          avatar: member.avatar,
          role: member.role,
          joinedAt: member.joinedAt as string | undefined,
        }
      : undefined;

  // استورهای persisted بعد از hydrate شدن (توسط AppShell) معتبرند — قبل از
  // آن درباره‌ی «پیدا نشد» قضاوت نکن تا پروفایل واقعی فلشِ not-found نزند.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // دیالوگ مشترک ویرایش پروفایل — فقط برای پروفایل خود کاربر در دسترس است
  const [editOpen, setEditOpen] = React.useState(false);

  if (!id) {
    return <ProfileNotFound onHome={() => go("home")} />;
  }

  if (!subject) {
    return mounted ? (
      <ProfileNotFound onHome={() => go("home")} />
    ) : (
      <div className="min-h-[60vh] bg-background pt-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="shimmer-bg h-44 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const displayName = subject?.name ?? "…";
  const firstName = displayName.split(" ")[0];
  const summary = xpSummary(events);
  const tier = tierForLevel(summary.level);
  const TierIcon = tier.icon;
  const completedTours = bookings.filter((b) => b.completedAt).length;

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <ScrollReveal y={10} className="mb-5">
          <button
            type="button"
            onClick={() => go("user-dashboard")}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-emerald/40 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            بازگشت به داشبورد
          </button>
        </ScrollReveal>

        {/* هدر پروفایل */}
        <ScrollReveal>
          <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-bl from-forest via-emerald-dark to-emerald p-6 md:p-8">
            <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-emerald-light/20 blur-3xl" />
            {isMe && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="absolute left-4 top-4 z-10 gap-1.5 rounded-xl border-cream/30 bg-transparent px-3.5 font-bold text-cream shadow-none hover:border-cream/50 hover:bg-cream/10 hover:text-cream dark:border-cream/30 dark:bg-transparent dark:hover:bg-cream/10"
              >
                <PencilLine className="h-4 w-4" />
                ویرایش پروفایل
              </Button>
            )}
            <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:gap-6 md:text-start">
              <Avatar className="h-24 w-24 shrink-0 rounded-3xl ring-2 ring-gold md:h-28 md:w-28">
                {subject?.avatar ? (
                  <AvatarImage src={subject.avatar} alt={displayName} />
                ) : (
                  <AvatarFallback className="rounded-3xl bg-gold/20 text-3xl font-bold text-gold">
                    {firstName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {subject?.role === "leader" ? (
                    <Badge className="border-gold/30 bg-gold/15 text-gold">
                      <Sparkles className="h-3 w-3" />
                      لیدر کاروان
                    </Badge>
                  ) : isMe ? (
                    <Badge className="border-gold/30 bg-gold/15 text-gold">
                      <TierIcon className="h-3 w-3" />
                      {tier.name}
                    </Badge>
                  ) : null}
                  {isMe && me?.city && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cream/25 bg-cream/10 px-2.5 py-0.5 text-[11px] font-bold text-cream">
                      <MapPin className="h-3 w-3" />
                      {me.city}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-extrabold text-cream md:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 text-sm text-cream/80">
                  {subject?.joinedAt
                    ? `عضو کوچ‌نشین از ${toPersianDate(subject.joinedAt)}`
                    : "عضو کوچ‌نشین از ۱ خرداد ۱۴۰۴"}
                </p>
                {isMe &&
                  (me?.bio ? (
                    <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-cream/85 md:mx-0">
                      {me.bio}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="mx-auto mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-dashed border-cream/35 px-3.5 py-1.5 text-[12px] font-bold text-cream/75 transition hover:border-cream/60 hover:text-cream md:mx-0"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      بیوگرافی‌ات را بنویس تا بقیه بهتر بشناسندت
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* نشان‌های تحلیلی — فقط برای پروفایل خود کاربر (داده‌ی محلی) */}
        <ScrollReveal delay={0.05}>
          <div className="mb-6 flex flex-wrap items-center gap-2.5">
            {isMe && dna ? (
              <TravelDnaBadge dna={dna} />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground">
                <Dna className="h-3.5 w-3.5" aria-hidden />
                DNA سفر {isMe ? "هنوز ساخته نشده" : "در دسترس نیست"}
              </span>
            )}
            {isMe ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                <TierIcon className="h-3.5 w-3.5" aria-hidden />
                {tier.name} · سطح {toFa(summary.level)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-bold text-muted-foreground">
                <Award className="h-3.5 w-3.5" aria-hidden />
                سطح کاروانی خصوصی
              </span>
            )}
          </div>
        </ScrollReveal>

        {/* آمار عمومی — بدون اطلاعات حساس */}
        <ScrollReveal delay={0.1}>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              icon={<Backpack className="h-5 w-5" />}
              tint="bg-emerald/10 text-emerald"
              value={isMe ? toFa(completedTours) : "—"}
              label="تور تکمیل‌شده"
            />
            <StatTile
              icon={<CalendarCheck className="h-5 w-5" />}
              tint="bg-gold/15 text-gold"
              value={isMe ? formatNumber(summary.total) : "—"}
              label="امتیاز تجربه (XP)"
            />
            <StatTile
              icon={<ShieldCheck className="h-5 w-5" />}
              tint="bg-emerald-light/10 text-emerald-light"
              value={isMe ? `${toFa(unlocked.length)} از ${toFa(ACHIEVEMENT_RULES.length)}` : "—"}
              label="نشان بازشده"
            />
          </div>
        </ScrollReveal>

        {/* نشان‌ها — فقط پروفایل خود کاربر */}
        {isMe && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <AchievementGrid />
            <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
              این صفحه پروفایل عمومی توست؛ همان چیزی که هم‌گروهی‌هایت در اتاق
              سفر می‌بینند. شماره تماس و ایمیل هرگز نمایش داده نمی‌شود.
            </p>
          </motion.div>
        )}

        {/* دیالوگ مشترک ویرایش پروفایل (فقط خود کاربر دکمه‌ی بازکردن را دارد) */}
        <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
      </div>
    </div>
  );
}

function StatTile({
  icon,
  tint,
  value,
  label,
}: {
  icon: React.ReactNode;
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 rounded-3xl border-border/60 bg-card p-5 text-center">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}>
        {icon}
      </span>
      <p className="text-lg font-extrabold leading-6">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}

function ProfileNotFound({ onHome }: { onHome: () => void }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-background px-4 pt-28 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
          <UserRound className="h-8 w-8" />
        </div>
        <p className="text-xl font-extrabold">این پروفایل در دسترس نیست</p>
        <p className="mt-2 text-sm text-muted-foreground">
          ممکن است این مسافر در هیچ اتاق گفت‌وگویی با تو مشترک نباشد.
        </p>
        <Button onClick={onHome} className="mt-5 bg-primary text-primary-foreground">
          بازگشت به خانه
        </Button>
      </div>
    </div>
  );
}
