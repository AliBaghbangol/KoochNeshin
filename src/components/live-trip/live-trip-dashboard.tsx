"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Mountain,
  Footprints,
  Thermometer,
  Radio,
  Shield,
  Users,
  Route,
  WifiOff,
  CloudSun,
  Navigation,
  Battery,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { UserBooking } from "@/store/bookings-store";
import type { Tour } from "@/types";
import { useLiveTrip } from "@/store/live-trip-store";
import { useGeolocation } from "@/lib/live-trip/use-geolocation";
import {
  cacheOfflineTripData,
  readOfflineTripData,
  isOnline,
  type OfflineTripData,
} from "@/lib/live-trip/offline-cache";
import { useBookings } from "@/store/bookings-store";
import { useNotifications } from "@/store/notifications-store";
import { useEmergencyContacts, RELATIONSHIP_LABEL } from "@/store/emergency-contacts-store";
import { track } from "@/lib/analytics/track";
import { LiveStatCard } from "./live-stat-card";
import { MemberStatusList } from "./member-status-list";
import { SosButton } from "./sos-button";
import { ElevationProfile } from "./elevation-profile";
import { WeatherForecast } from "./weather-forecast";
import { PaceProgressCard } from "./pace-progress-card";
import { AltitudeNotification } from "./altitude-notification";
import { PaceAnalysis } from "./pace-analysis";
import { toFa, toPersianDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LocationShareScope } from "@/types/live-trip";

/**
 * Live Trip dashboard — spec §3.
 *
 * Layout (mobile-first):
 *   🔴 LIVE TRIP banner
 *   [📍 موقعیت] [⛰ ارتفاع] [🥾 فاصله] [🌡 دما]
 *   👥 X / Y عضو
 *   [ایمنی]  [گروه]  [مسیر]
 *   SOS button + legal note
 *
 * Privacy: location sharing is OFF by default. A modal asks the user on
 * first entry to pick a scope.
 *
 * Offline: when navigator.onLine === false, the dashboard falls back to
 * the offline cache (itinerary / leader contact / members / safety checklist).
 */
export function LiveTripDashboard({
  booking,
  tour,
}: {
  booking: UserBooking;
  tour: Tour | null;
}) {
  const liveTrip = useLiveTrip();
  const trip = liveTrip.getTrip(booking.id);
  const startTrip = useLiveTrip((s) => s.startTrip);
  const setShareScope = useLiveTrip((s) => s.setShareScope);
  const setLocation = useLiveTrip((s) => s.setLocation);
  const addNotification = useNotifications((s) => s.add);
  const completeBooking = useBookings((s) => s.completeBooking);
  const emergencyContacts = useEmergencyContacts((s) => s.contacts);

  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [offlineData, setOfflineData] = React.useState<OfflineTripData | null>(null);
  const [online, setOnline] = React.useState(true);
  // Track whether the privacy modal has been shown at least once — never
  // auto-re-open it after the user dismissed it (spec §3: opt-in must be
  // explicit, but also must not nag).
  const privacyShownRef = React.useRef(false);

  // ensure trip exists
  React.useEffect(() => {
    if (!trip) {
      startTrip(booking.id, booking.tourTitle, undefined);
    }
  }, [trip, booking, startTrip]);

  // watch online state
  React.useEffect(() => {
    const update = () => setOnline(isOnline());
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // build & cache offline data once the trip starts
  React.useEffect(() => {
    if (!trip || !tour) return;
    const cached = readOfflineTripData(booking.id);
    if (cached) {
      setOfflineData(cached);
      return;
    }
    const data: OfflineTripData = {
      itinerary: tour.itinerary,
      leaderContact: "۰۹۱۲-۱۲۳-۴۵۶۷", // TODO(backend): from leader profile
      leaderName: booking.leader,
      members: trip.members.map((m) => ({ name: m.name, avatar: m.avatar })),
      safetyChecklist: [
        "کفش کوهنوردی",
        "کاپشن ضدآب",
        "فلاسک آب",
        "کرم ضدآفتاب",
        "کیت اولیه",
      ],
      cachedAt: new Date().toISOString(),
    };
    cacheOfflineTripData(booking.id, data);
    setOfflineData(data);
  }, [trip, tour, booking]);

  // prompt for share scope on first entry (once only — never re-nag)
  React.useEffect(() => {
    if (trip && !privacyShownRef.current) {
      privacyShownRef.current = true;
      const id = window.setTimeout(() => setShareModalOpen(true), 600);
      return () => window.clearTimeout(id);
    }
  }, [trip?.bookingId]);

  // enable geolocation only if user opted in
  const geoEnabled =
    trip?.shareScope === "leader_only" || trip?.shareScope === "group";
  const { position, error: geoError } = useGeolocation(geoEnabled);

  // push position into the store + analytics
  React.useEffect(() => {
    if (!position || !trip) return;
    setLocation(booking.id, {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: new Date(position.timestamp).toISOString(),
    });
    track("live_location_shared", {
      bookingId: booking.id,
      scope: trip.shareScope,
    });
  }, [position?.timestamp]);

  if (!trip) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted-foreground">
        در حال آماده‌سازی حالت زنده...
      </div>
    );
  }

  // mock elevation based on tour category
  const elevation =
    tour?.category === "mountain" ? 4200 : tour?.category === "desert" ? 200 : 800;

  function pickScope(scope: LocationShareScope) {
    setShareScope(booking.id, scope);
    setShareModalOpen(false);
    if (scope !== "none") {
      track("live_location_shared", { bookingId: booking.id, scope });
      toast.success(
        scope === "leader_only"
          ? "موقعیتت فقط برای لیدر قابل مشاهده است."
          : "موقعیتت برای کل گروه قابل مشاهده است.",
      );
    } else {
      toast.info("اشتراک موقعیت خاموش ماند. هر زمان بخواهی می‌تونی روشنش کنی.");
    }
  }

  function handleSos(loc?: { lat: number; lng: number }) {
    // Notify the user about the SOS dispatch
    addNotification({
      type: "system",
      title: "هشدار اضطراری ثبت شد",
      body: `موقعیت فعلی تو ثبت شد و به ${booking.leader} ارسال شد.`,
      actionLabel: "مشاهده جزئیات",
      actionView: "safety-center",
    });

    // Iterate over the user's emergency contacts that have notifyOnSos enabled
    // and create a notification per contact (mock — real backend would push
    // an actual SMS / push notification to each contact's phone/device).
    // TODO(backend): POST /api/trips/:id/sos with contact ids + location.
    const sosContacts = emergencyContacts.filter((c) => c.notifyOnSos);
    sosContacts.forEach((c) => {
      addNotification({
        type: "system",
        title: `اطلاع‌رسانی به ${c.name}`,
        body: `موقعیت اضطراری شما به ${c.name} (${RELATIONSHIP_LABEL[c.relationship]}) ارسال شد.`,
        actionLabel: "تماس",
        actionView: "safety-center",
      });
    });

    // Summary toast — tells the user how many people were notified
    const totalNotified = 1 + sosContacts.length; // leader + contacts
    toast.success(
      `هشدار اضطراری به ${totalNotified} نفر ارسال شد.`,
      {
        description: `لیدر (${booking.leader})` +
          (sosContacts.length > 0
            ? ` + ${sosContacts.length} مخاطب اضطراری`
            : ""),
        duration: 6000,
      },
    );

    if (loc) {
      toast.info(`موقعیت: ${loc.lat.toFixed(4)}، ${loc.lng.toFixed(4)}`, {
        description: "برای تماس با اورژانس ۱۱۵ را لمس کن.",
      });
    }
  }

  function endTrip() {
    liveTrip.setStatus(booking.id, "completed");
    completeBooking(booking.id);
    toast.success("سفر پایان یافت. خاطراتت را در بخش داستان‌های سفر منتشر کن!");
  }

  return (
    <div className="space-y-4">
      {/* LIVE banner — sticky glassmorphism at top */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-l from-red-500/15 via-red-500/8 to-transparent p-4 shadow-lg backdrop-blur-md"
      >
        {/* decorative animated red glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-red-500/30 blur-3xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <div>
              <p className="text-sm font-black text-red-600 dark:text-red-400">
                حالت زنده سفر
              </p>
              <p className="text-[11px] text-muted-foreground">
                {booking.tourTitle}
              </p>
            </div>
          </div>
          {!online && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sunset/15 px-2 py-1 text-[10px] font-bold text-sunset">
              <WifiOff className="h-3 w-3" />
              آفلاین — از cache خوانده می‌شود
            </span>
          )}
        </div>
      </motion.div>

      {/* stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <LiveStatCard
          emoji="📍"
          icon={MapPin}
          label="موقعیت فعلی"
          tone="live"
          value={
            trip.currentLocation ? (
              <span className="text-[13px] font-bold">
                {toFa(trip.currentLocation.lat.toFixed(3))}،{" "}
                {toFa(trip.currentLocation.lng.toFixed(3))}
              </span>
            ) : geoEnabled ? (
              <span className="text-[13px] text-muted-foreground">
                در حال یافتن...
              </span>
            ) : (
              <span className="text-[13px] text-muted-foreground">غیرفعال</span>
            )
          }
          hint={
            trip.currentLocation
              ? `دقت ~${toFa(Math.round(trip.currentLocation.accuracy ?? 0))}م`
              : "اشتراک موقعیت را روشن کن"
          }
        />
        <LiveStatCard
          emoji="⛰️"
          icon={Mountain}
          label="ارتفاع تقریبی"
          value={`${toFa(elevation)} متر`}
          hint={tour?.destination}
          delay={0.05}
        />
        <LiveStatCard
          emoji="🥾"
          icon={Footprints}
          label="فاصله تا نقطه بعدی"
          value={
            trip.nextWaypointDistanceKm
              ? `${toFa(trip.nextWaypointDistanceKm)} کیلومتر`
              : "—"
          }
          hint="برآورد تقریبی"
          delay={0.1}
        />
        <LiveStatCard
          emoji="🌡️"
          icon={Thermometer}
          label="دما"
          value={
            trip.weatherSummary ? (
              <span className="text-[13px]">{trip.weatherSummary}</span>
            ) : (
              <span className="text-[13px] text-muted-foreground">۸°C آفتابی</span>
            )
          }
          hint="از پیش‌بینی هوا"
          delay={0.15}
        />
      </div>

      {geoError && (
        <div className="rounded-2xl border border-sunset/30 bg-sunset/5 p-3 text-[11px] text-sunset">
          {geoError}
        </div>
      )}

      {/* altitude notification — fires when crossing elevation thresholds */}
      {tour && (
        <AltitudeNotification
          tour={tour}
          currentElevation={
            tour.category === "mountain"
              ? 4200
              : tour.category === "desert"
                ? 200
                : 800
          }
        />
      )}

      {/* location share toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border bg-card p-3">
        <div className="flex items-center gap-2 text-[12px]">
          <Navigation className="h-4 w-4 text-emerald" />
          <span className="font-bold">اشتراک موقعیت:</span>
          <span className="text-muted-foreground">
            {trip.shareScope === "none"
              ? "خاموش"
              : trip.shareScope === "leader_only"
                ? "فقط لیدر"
                : "کل گروه"}
          </span>
        </div>
        <div className="flex gap-1">
          {(
            [
              { v: "leader_only", label: "فقط لیدر" },
              { v: "group", label: "کل گروه" },
              { v: "none", label: "خاموش" },
            ] as { v: LocationShareScope; label: string }[]
          ).map((opt) => (
            <Button
              key={opt.v}
              size="sm"
              variant={trip.shareScope === opt.v ? "default" : "outline"}
              className="h-8 px-2.5 text-[11px]"
              onClick={() => pickScope(opt.v)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* main grid: members + SOS / quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemberStatusList trip={trip} />
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]">
            <h3 className="mb-1 text-sm font-bold">اقدامات سریع</h3>
            <p className="mb-3 text-[10px] text-muted-foreground">
              هشدار به لیدر + {emergencyContacts.filter((c) => c.notifyOnSos).length} مخاطب اضطراری ارسال می‌شود
            </p>
            <div className="flex flex-col items-center gap-3">
              <SosButton
                onTrigger={(loc) => handleSos(loc)}
                location={trip.currentLocation}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <a
                href="tel:115"
                className="rounded-xl bg-red-500/10 py-2 text-[11px] font-bold text-red-600 hover:bg-red-500/20"
              >
                اورژانس
                <br />
                ۱۱۵
              </a>
              <a
                href="tel:110"
                className="rounded-xl bg-muted py-2 text-[11px] font-bold hover:bg-muted/80"
              >
                پلیس
                <br />
                ۱۱۰
              </a>
              <a
                href="tel:112"
                className="rounded-xl bg-muted py-2 text-[11px] font-bold hover:bg-muted/80"
              >
                اطلاع‌رسانی
                <br />
                ۱۱۲
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <QuickAction icon={Shield} label="ایمنی" />
            <QuickAction icon={Users} label="گروه" />
            <QuickAction icon={Route} label="مسیر" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={endTrip}
          >
            پایان سفر
          </Button>
        </div>
      </div>

      {/* offline itinerary preview */}
      {offlineData && (
        <div className="rounded-3xl border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <CloudSun className="h-4 w-4 text-gold" />
              مسیر سفر (آفلاین)
            </h3>
            <span className="text-[10px] text-muted-foreground">
              لیدر: {offlineData.leaderName} · {offlineData.leaderContact}
            </span>
          </div>
          <ol className="space-y-1.5">
            {offlineData.itinerary.slice(0, 4).map((d) => (
              <li
                key={d.day}
                className="flex items-start gap-2 rounded-xl bg-background/60 p-2 text-[12px]"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald/10 text-[10px] font-bold text-emerald">
                  {toFa(d.day)}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{d.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.description}
                  </p>
                </div>
                {d.elevation && (
                  <span className="text-[10px] text-muted-foreground">
                    {toFa(d.elevation)}م
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* elevation profile mini-chart */}
      {tour && (
        <ElevationProfile
          tour={tour}
          currentDay={
            trip.status === "active"
              ? Math.min(2, Math.max(1, tour.itinerary.length - 1))
              : 1
          }
        />
      )}

      {/* weather forecast card */}
      {tour && (
        <WeatherForecast
          tour={tour}
          currentDay={
            trip.status === "active"
              ? Math.min(2, Math.max(1, tour.itinerary.length - 1))
              : 1
          }
        />
      )}

      {/* pace & progress card */}
      {tour && (
        <PaceProgressCard
          tour={tour}
          currentDay={
            trip.status === "active"
              ? Math.min(2, Math.max(1, tour.itinerary.length - 1))
              : 1
          }
        />
      )}

      {/* pace analysis — speed-over-time chart */}
      {tour && (
        <PaceAnalysis
          tour={tour}
          currentDay={
            trip.status === "active"
              ? Math.min(2, Math.max(1, tour.itinerary.length - 1))
              : 1
          }
        />
      )}

      {/* privacy modal */}
      <ShareScopeModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        onPick={pickScope}
      />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
}: {
  icon: typeof Shield;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 rounded-2xl border bg-card py-3 text-[11px] font-bold transition hover:bg-muted/40"
    >
      <Icon className="h-4 w-4 text-emerald" />
      {label}
    </button>
  );
}

function ShareScopeModal({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (s: LocationShareScope) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald/10 text-emerald">
              <Radio className="h-5 w-5" />
            </span>
            اشتراک‌گذاری موقعیت
          </DialogTitle>
          <DialogDescription>
            می‌خوای موقعیتت رو با گروه/لیدر به اشتراک بذاری؟ این کمک می‌کنه در صورت
            نیاز سریع‌تر پیدات کنن. پیش‌فرض خاموش است.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2.5">
          <button
            onClick={() => onPick("leader_only")}
            className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald/30 bg-emerald/5 p-3.5 text-right shadow-sm transition hover:border-emerald hover:bg-emerald/10 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald/15 text-emerald">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">فقط لیدر</p>
                <p className="text-[10px] text-muted-foreground">
                  لیدر می‌تواند موقعیتت را ببیند.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              پیشنهادی
            </span>
          </button>
          <button
            onClick={() => onPick("group")}
            className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3.5 text-right shadow-sm transition hover:border-emerald/40 hover:bg-muted/30 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">کل گروه</p>
                <p className="text-[10px] text-muted-foreground">
                  همه اعضای اتاق سفر می‌توانند موقعیتت را ببینند.
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => onPick("none")}
            className="flex items-center justify-between gap-3 rounded-2xl border border-dashed bg-background/40 p-3.5 text-right transition hover:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Battery className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">نه، فعلاً نه</p>
                <p className="text-[10px] text-muted-foreground">
                  موقعیتت به اشتراک گذاشته نمی‌شود. بعداً می‌تونی روشنش کنی.
                </p>
              </div>
            </div>
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          🔒 هر زمان بخواهی می‌توانی این تنظیم را خاموش یا روشن کنی.
        </p>
      </DialogContent>
    </Dialog>
  );
}
