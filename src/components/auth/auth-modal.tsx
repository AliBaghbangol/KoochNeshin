"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  Mountain,
  ChevronLeft,
  Clock,
  Upload,
  ShieldCheck,
  Store,
  Compass,
  Sparkles,
  Check,
  Shield,
} from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useAuth } from "@/store/auth-store";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode =
  | "roles"
  | "traveler"
  | "traveler-otp"
  | "leader-step-1"
  | "leader-step-2"
  | "leader-pending"
  | "seller-step-1"
  | "seller-pending";

type RoleKey = "traveler" | "leader" | "seller" | "admin";

interface RoleConfig {
  key: RoleKey;
  title: string;
  desc: string;
  icon: typeof Mountain;
  color: string;
  bg: string;
  border: string;
  gradient: string;
}

const ROLES: RoleConfig[] = [
  {
    key: "traveler",
    title: "مسافر / خریدار",
    desc: "تور رزرو کن، تجهیزات بخر یا اجاره کن",
    icon: Compass,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "hover:border-accent",
    gradient: "from-accent to-sunset",
  },
  {
    key: "seller",
    title: "فروشنده تجهیزات",
    desc: "محصولاتت را بفروش یا اجاره بده",
    icon: Store,
    color: "text-emerald",
    bg: "bg-emerald/10",
    border: "hover:border-emerald",
    gradient: "from-emerald to-emerald-dark",
  },
  {
    key: "leader",
    title: "لیدر تور",
    desc: "تورهایت را مدیریت کن، مسافر بگیر",
    icon: Mountain,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "hover:border-primary",
    gradient: "from-primary to-emerald-dark",
  },
  {
    key: "admin",
    title: "مدیر سایت",
    desc: "دسترسی کامل به مدیریت پلتفرم",
    icon: Shield,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "hover:border-gold",
    gradient: "from-gold to-sunset",
  },
];

export function AuthModal() {
  // Selective subscriptions: the modal stays mounted app-wide; slice
  // selectors keep it from re-rendering on unrelated nav/auth changes.
  const authOpen = useNav((s) => s.authOpen);
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const go = useNav((s) => s.go);
  const loginAsTraveler = useAuth((s) => s.loginAsTraveler);
  const loginAsLeader = useAuth((s) => s.loginAsLeader);
  const loginAsSeller = useAuth((s) => s.loginAsSeller);
  const loginAsAdmin = useAuth((s) => s.loginAsAdmin);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const [mode, setMode] = React.useState<Mode>("roles");
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [timer, setTimer] = React.useState(0);
  // leader form state
  const [leaderName, setLeaderName] = React.useState("");
  const [leaderPhone, setLeaderPhone] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [experience, setExperience] = React.useState("");
  // seller form state
  const [sellerName, setSellerName] = React.useState("");
  const [sellerPhone, setSellerPhone] = React.useState("");
  const [storeName, setStoreName] = React.useState("");

  React.useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // Whether the user was ALREADY authenticated at the moment the modal
  // opened. When they deliberately open the modal while logged in
  // (e.g. panel gates «ورود به عنوان مدیر/فروشنده/لیدر» for role
  // switching) the safety net below must NOT slam it shut.
  const authedAtOpen = React.useRef(false);

  React.useEffect(() => {
    if (authOpen) {
      authedAtOpen.current = isAuthenticated;
      setMode("roles");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authOpen]);

  // Safety net: if the modal somehow opens for a guest (e.g. a gate fired
  // before persist rehydration) and authentication arrives afterwards,
  // close it. Login handlers close the modal themselves; this only guards
  // the rehydration race — never blocks an intentional re-open.
  React.useEffect(() => {
    if (authOpen && isAuthenticated && !authedAtOpen.current) {
      setAuthOpen(false);
    }
  }, [authOpen, isAuthenticated, setAuthOpen]);

  const sendOtp = () => {
    if (phone.length < 10) {
      toast.error("شماره موبایل معتبر نیست");
      return;
    }
    setMode("traveler-otp");
    setOtp("");
    setTimer(60);
    toast.success("کد تایید ارسال شد", {
      description: "کد نمایشی: ۱۲۳۴۵۶",
    });
  };

  const verifyOtp = () => {
    if (otp.length !== 6) {
      toast.error("کد را کامل وارد کنید");
      return;
    }
    loginAsTraveler(name || "مسافر کوچ‌نشین", phone);
    toast.success("خوش آمدید!", {
      description: "ورود موفقیت‌آمیز بود.",
    });
    setAuthOpen(false);
    go("user-dashboard");
  };

  // Quick demo login — instantly logs in and navigates to the role's panel
  const quickLogin = (role: RoleKey) => {
    if (role === "traveler") {
      loginAsTraveler("سارا احمدی", "09151234567");
      toast.success("ورود به عنوان مسافر", {
        description: "پنل مسافر فعال شد",
      });
      setAuthOpen(false);
      go("user-dashboard");
    } else if (role === "seller") {
      loginAsSeller("کوروش تجهیز", "09157654321");
      toast.success("ورود به عنوان فروشنده", {
        description: "پنل فروشنده فعال شد",
      });
      setAuthOpen(false);
      go("seller-dashboard");
    } else if (role === "leader") {
      loginAsLeader("سینا رستمی", "09155558899");
      toast.success("ورود به عنوان لیدر تور", {
        description: "پنل لیدر فعال شد",
      });
      setAuthOpen(false);
      go("leader-dashboard");
    } else if (role === "admin") {
      loginAsAdmin("مدیر کل کوچ‌نشین", "09150000000");
      toast.success("ورود به عنوان مدیر سایت", {
        description: "پنل مدیریت فعال شد",
      });
      setAuthOpen(false);
      go("admin-dashboard");
    }
  };

  const submitLeader = () => {
    if (!leaderName || !leaderPhone || !bio) {
      toast.error("لطفاً همه فیلدها را پر کنید");
      return;
    }
    loginAsLeader(leaderName, leaderPhone);
    setMode("leader-pending");
    toast.success("درخواست شما ثبت شد", {
      description: "پس از تایید ادمین، پنل لیدر فعال می‌شود.",
    });
  };

  const submitSeller = () => {
    if (!sellerName || !sellerPhone || !storeName) {
      toast.error("لطفاً همه فیلدها را پر کنید");
      return;
    }
    loginAsSeller(sellerName, sellerPhone);
    setMode("seller-pending");
    toast.success("فروشگاه شما ثبت شد", {
      description: "پنل فروشنده فعال است.",
    });
  };

  const close = () => setAuthOpen(false);

  return (
    <AnimatePresence>
      {authOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[80] bg-forest/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border bg-background shadow-2xl"
            >
              {/* Decorative header */}
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-emerald to-forest">
                <div className="absolute inset-0 bg-noise opacity-20" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/30 blur-2xl" />
                <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
                <button
                  onClick={close}
                  className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 right-5 flex items-center gap-2">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur">
                    <Mountain className="h-6 w-6" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-lg font-extrabold leading-tight">
                      ورود به کوچ‌نشین
                    </h3>
                    <p className="text-[11px] text-white/70">
                      نقش خود را انتخاب کن
                    </p>
                  </div>
                </div>
              </div>

              <div className="custom-scroll max-h-[calc(90vh-7rem)] overflow-y-auto p-6 max-sm:p-5">
                <AnimatePresence mode="wait">
                  {/* ===== Role selection ===== */}
                  {mode === "roles" && (
                    <motion.div
                      key="roles"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h4 className="text-xl font-extrabold">
                          به کدام نقش وارد می‌شوی؟
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          هر نقش پنل مخصوص خودش را دارد.
                        </p>
                      </div>

                      {/* Role cards */}
                      <div className="space-y-3">
                        {ROLES.map((role) => {
                          const Icon = role.icon;
                          return (
                            <div
                              key={role.key}
                              className={cn(
                                "group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-4 transition hover:shadow-lg",
                                role.border,
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "grid h-12 w-12 place-items-center rounded-xl",
                                    role.bg,
                                    role.color,
                                  )}
                                >
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold">{role.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {role.desc}
                                  </p>
                                </div>
                              </div>
                              {/* Action buttons */}
                              <div className="mt-3 flex gap-2 max-sm:flex-col max-sm:gap-2">
                                <button
                                  onClick={() => {
                                    if (role.key === "traveler") {
                                      setName("");
                                      setPhone("");
                                      setMode("traveler");
                                    } else if (role.key === "leader") {
                                      setMode("leader-step-1");
                                    } else if (role.key === "seller") {
                                      setMode("seller-step-1");
                                    }
                                  }}
                                  className={cn(
                                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition",
                                    "border-border text-foreground hover:bg-secondary",
                                    "max-sm:min-h-11",
                                  )}
                                >
                                  {role.key === "traveler"
                                    ? "ورود با موبایل"
                                    : "ثبت‌نام"}
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => quickLogin(role.key)}
                                  className={cn(
                                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l px-3 py-2 text-xs font-bold text-white shadow-md transition hover:shadow-lg",
                                    role.gradient,
                                    "max-sm:min-h-11",
                                  )}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  ورود سریع (دمو)
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Info note */}
                      <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>
                          «ورود سریع» برای پیش‌نمایش پنل‌هاست. برای استفاده واقعی،
                          ثبت‌نام یا ورود با موبایل را انتخاب کن.
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== Traveler login (phone) ===== */}
                  {mode === "traveler" && (
                    <motion.div
                      key="traveler"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <BackButton onClick={() => setMode("roles")} />
                      <div>
                        <h4 className="text-xl font-extrabold">ورود مسافر</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          با شماره موبایل وارد شو
                        </p>
                      </div>
                      <div className="space-y-3">
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                        />
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="09xxxxxxxxx"
                            inputMode="tel"
                            className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <Button
                          onClick={sendOtp}
                          className="h-11 w-full bg-primary text-primary-foreground"
                        >
                          دریافت کد تایید
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== Traveler OTP ===== */}
                  {mode === "traveler-otp" && (
                    <motion.div
                      key="traveler-otp"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5 text-center"
                    >
                      <BackButton onClick={() => setMode("traveler")} />
                      <div>
                        <h4 className="text-xl font-extrabold">
                          کد تایید را وارد کن
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          کد ۶ رقمی به شماره {toFa(phone)} ارسال شد
                        </p>
                      </div>
                      <div dir="ltr" className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(v) => setOtp(v)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="max-sm:h-8 max-sm:w-8" />
                            <InputOTPSlot index={1} className="max-sm:h-8 max-sm:w-8" />
                            <InputOTPSlot index={2} className="max-sm:h-8 max-sm:w-8" />
                            <InputOTPSlot index={3} className="max-sm:h-8 max-sm:w-8" />
                            <InputOTPSlot index={4} className="max-sm:h-8 max-sm:w-8" />
                            <InputOTPSlot index={5} className="max-sm:h-8 max-sm:w-8" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button
                        onClick={verifyOtp}
                        className="h-12 w-full bg-primary text-primary-foreground"
                      >
                        تایید و ورود
                      </Button>
                      <button
                        disabled={timer > 0}
                        onClick={sendOtp}
                        className="text-sm text-primary disabled:text-muted-foreground"
                      >
                        {timer > 0
                          ? `ارسال مجدد در ${toFa(timer)} ثانیه`
                          : "ارسال مجدد کد"}
                      </button>
                    </motion.div>
                  )}

                  {/* ===== Leader step 1 ===== */}
                  {mode === "leader-step-1" && (
                    <motion.div
                      key="ls1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <BackButton onClick={() => setMode("roles")} />
                      <StepHeader step={1} total={2} title="احراز هویت لیدر" subtitle="مرحله ۱ از ۲ — اطلاعات پایه" />
                      <div className="space-y-3">
                        <input
                          value={leaderName}
                          onChange={(e) => setLeaderName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                        />
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={leaderPhone}
                            onChange={(e) =>
                              setLeaderPhone(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="شماره موبایل"
                            inputMode="tel"
                            className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            placeholder="ایمیل (اختیاری)"
                            className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="بیوگرافی و سابقه فعالیت شما به عنوان راهنمای تور"
                          rows={4}
                          className="w-full rounded-xl border bg-background p-4 text-sm focus:border-primary focus:outline-none"
                        />
                        <input
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="سال‌های تجربه"
                          inputMode="numeric"
                          className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <Button
                        onClick={() => setMode("leader-step-2")}
                        className="h-11 w-full bg-primary text-primary-foreground"
                      >
                        مرحله بعد
                      </Button>
                    </motion.div>
                  )}

                  {/* ===== Leader step 2: upload docs ===== */}
                  {mode === "leader-step-2" && (
                    <motion.div
                      key="ls2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <BackButton onClick={() => setMode("leader-step-1")} />
                      <StepHeader step={2} total={2} title="بارگذاری مدارک" subtitle="مرحله ۲ از ۲ — مدارک" />
                      <div className="space-y-3">
                        {[
                          "کارت ملی",
                          "مجوز راهنمای تور",
                          "گواهی مهارت‌های کوهستان",
                        ].map((doc) => (
                          <label
                            key={doc}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-4 transition hover:border-primary"
                          >
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{doc}</p>
                              <p className="text-xs text-muted-foreground">
                                PNG یا JPG — حداکثر ۲ مگابایت
                              </p>
                            </div>
                            <input type="file" className="hidden" />
                          </label>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        مدارک شما پس از بررسی توسط تیم پشتیبانی، حداکثر ظرف ۴۸
                        ساعت تایید می‌شود.
                      </div>
                      <Button
                        onClick={submitLeader}
                        className="h-11 w-full bg-primary text-primary-foreground"
                      >
                        ثبت نهایی درخواست
                      </Button>
                    </motion.div>
                  )}

                  {/* ===== Leader pending ===== */}
                  {mode === "leader-pending" && (
                    <motion.div
                      key="leader-pending"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-5 py-4 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold/15 text-gold"
                      >
                        <Clock className="h-10 w-10" />
                      </motion.div>
                      <div>
                        <h4 className="text-xl font-extrabold">
                          در انتظار تایید ادمین
                        </h4>
                        <p className="mt-2 text-sm text-muted-foreground">
                          درخواست لیدری شما ثبت شد. به‌محض تایید، پنل لیدر فعال
                          می‌شود. برای پیش‌نمایش، می‌توانی پنل را ببینی.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          close();
                          go("leader-dashboard");
                        }}
                        className="h-11 w-full bg-primary text-primary-foreground"
                      >
                        پیش‌نمایش پنل لیدر
                      </Button>
                    </motion.div>
                  )}

                  {/* ===== Seller step 1 ===== */}
                  {mode === "seller-step-1" && (
                    <motion.div
                      key="ss1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <BackButton onClick={() => setMode("roles")} />
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald text-xs font-bold text-white">
                            {toFa(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            اطلاعات فروشگاه
                          </span>
                        </div>
                        <h4 className="text-xl font-extrabold">
                          ثبت‌نام فروشنده
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <input
                          value={sellerName}
                          onChange={(e) => setSellerName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none"
                        />
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={sellerPhone}
                            onChange={(e) =>
                              setSellerPhone(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="شماره موبایل"
                            inputMode="tel"
                            className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:border-emerald focus:outline-none"
                          />
                        </div>
                        <div className="relative">
                          <Store className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="نام فروشگاه"
                            className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:border-emerald focus:outline-none"
                          />
                        </div>
                        <textarea
                          placeholder="توضیحات فروشگاه (چه نوع تجهیزاتی می‌فروشید)"
                          rows={3}
                          className="w-full rounded-xl border bg-background p-4 text-sm focus:border-emerald focus:outline-none"
                        />
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                        پس از ثبت‌نام، می‌توانی محصولاتت را اضافه کنی و فروش را
                        شروع کنی.
                      </div>
                      <Button
                        onClick={submitSeller}
                        className="h-11 w-full bg-emerald text-white"
                      >
                        ثبت فروشگاه
                      </Button>
                    </motion.div>
                  )}

                  {/* ===== Seller pending/success ===== */}
                  {mode === "seller-pending" && (
                    <motion.div
                      key="seller-pending"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-5 py-4 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald/15 text-emerald"
                      >
                        <Check className="h-10 w-10" strokeWidth={3} />
                      </motion.div>
                      <div>
                        <h4 className="text-xl font-extrabold">
                          فروشگاه شما فعال شد!
                        </h4>
                        <p className="mt-2 text-sm text-muted-foreground">
                          خوش آمدی! می‌توانی محصولاتت را مدیریت کنی و سفارش‌ها را
                          ببینی.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          close();
                          go("seller-dashboard");
                        }}
                        className="h-11 w-full bg-emerald text-white"
                      >
                        ورود به پنل فروشنده
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Helper components ---

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4 rotate-180" /> بازگشت
    </button>
  );
}

function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {toFa(step)}
        </span>
        <span className="text-sm text-muted-foreground">
          {subtitle}
        </span>
      </div>
      <h4 className="text-xl font-extrabold">{title}</h4>
    </div>
  );
}
