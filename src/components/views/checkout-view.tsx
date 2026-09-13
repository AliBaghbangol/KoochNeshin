"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Backpack,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  Wallet,
  User,
  Phone,
  Mail,
  IdCard,
  MapPin,
  AlertCircle,
  ShieldCheck,
  PartyPopper,
  Home as HomeIcon,
  LayoutDashboard,
  Lock,
  Loader2,
  Tag,
  Calendar,
  Package,
  Building2,
  Printer,
} from "lucide-react";
import { useGo } from "@/lib/use-go";
import { useCart } from "@/store/cart-store";
import { useAuth } from "@/store/auth-store";
import { useBookings } from "@/store/bookings-store";
import { useXP } from "@/store/xp-store";
import { useOrders } from "@/store/orders-store";
import { useSellerOrders } from "@/store/seller-orders-store";
import { useWallet } from "@/store/wallet-store";
import { tours } from "@/mocks/tours";
import { toFa, formatCurrency, toPersianDate } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { CartItemMetaChips } from "@/components/common/cart-item-meta";
import { showFloatingAlert } from "@/components/common/floating-alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types";

/**
 * Front-end-only discount code table. Backend is out of scope for this
 * phase, so we validate codes against this map.
 *   "KOCH10"   → 10% off
 *   "SUMMER20" → 20% off
 */
const DISCOUNT_CODES: Record<string, number> = {
  KOCH10: 0.1,
  SUMMER20: 0.2,
};

const STEPS = [
  { key: "cart", label: "سبد خرید", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "info", label: "اطلاعات مسافر", icon: <User className="h-4 w-4" /> },
  { key: "payment", label: "پرداخت", icon: <CreditCard className="h-4 w-4" /> },
  { key: "confirm", label: "تایید", icon: <Check className="h-4 w-4" /> },
] as const;

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function genBookingRef() {
  let s = "KN-";
  for (let i = 0; i < 6; i++) {
    s += PERSIAN_DIGITS[Math.floor(Math.random() * 10)];
  }
  return s;
}

function EmptyCartState() {
  const go = useGo();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-24">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="h-11 w-11" />
        </div>
        <div>
          <p className="text-xl font-bold">کوله‌پشتی شما خالی است</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            برای ادامه فرآیند پرداخت، ابتدا یک تور یا تجهیز به سبد خرید اضافه
            کنید.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => go("tours")}
            className="bg-primary text-primary-foreground"
          >
            <Backpack className="h-4 w-4" />
            کاوش تورها
          </Button>
          <Button
            variant="outline"
            onClick={() => go("equipment")}
          >
            <Package className="h-4 w-4" />
            فروشگاه تجهیزات
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  current,
  completed,
}: {
  current: number;
  completed: number;
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isDone = idx < completed;
          const isCurrent = idx === current;
          const isUpcoming = idx > current;
          return (
            <React.Fragment key={step.key}>
              <div className="flex shrink-0 flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.05 : 1,
                  }}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl border-2 transition-colors",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary shadow-md shadow-primary/20",
                    isUpcoming &&
                      "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-5 w-5" /> : step.icon}
                </motion.div>
                <span
                  className={cn(
                    "hidden text-xs font-bold sm:block",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {toFa(idx + 1)}. {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: idx < completed ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 origin-right bg-primary"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function CartLineItem({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const typeLabel =
    item.type === "tour"
      ? "تور"
      : item.type === "equipment-rent"
      ? "اجاره تجهیز"
      : "خرید تجهیز";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="flex gap-3 rounded-2xl border bg-card p-3 shadow-sm"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary max-sm:h-20 max-sm:w-20">
        <SmartImage
          src={item.image}
          alt={item.title}
          fallback={item.type === "tour" ? "tour" : "equipment"}
          shimmer={false}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="line-clamp-2 text-sm font-bold leading-6">
              {item.title}
            </p>
            <span
              className={cn(
                "mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold",
                item.type === "tour"
                  ? "bg-primary/10 text-primary"
                  : item.type === "equipment-rent"
                  ? "bg-sunset/10 text-sunset"
                  : "bg-gold/15 text-gold"
              )}
            >
              {item.type === "tour" && <Calendar className="ml-1 inline h-2.5 w-2.5" />}
              {item.type === "equipment-rent" && <Calendar className="ml-1 inline h-2.5 w-2.5" />}
              {item.type === "equipment-sale" && <Tag className="ml-1 inline h-2.5 w-2.5" />}
              {typeLabel}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive after:absolute after:-inset-2.5 after:content-['']"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <CartItemMetaChips meta={item.meta} type={item.type} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-2">
          <div className="flex items-center gap-1 rounded-lg border bg-background">
            <button
              onClick={() => onUpdateQty(item.quantity - 1)}
              className="relative grid h-7 w-7 place-items-center rounded-r-lg hover:bg-secondary after:absolute after:-inset-2.5 after:content-['']"
              aria-label="کاهش"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-sm font-bold">
              {toFa(item.quantity)}
            </span>
            <button
              onClick={() => onUpdateQty(item.quantity + 1)}
              className="relative grid h-7 w-7 place-items-center rounded-l-lg hover:bg-secondary after:absolute after:-inset-2.5 after:content-['']"
              aria-label="افزایش"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-sm font-extrabold text-primary">
            {formatCurrency(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function OrderSummary({
  onCheckout,
  checkoutLabel,
  appliedCode,
  onApplyCode,
}: {
  onCheckout?: () => void;
  checkoutLabel?: string;
  appliedCode?: string | null;
  onApplyCode?: (code: string | null) => void;
}) {
  const { items, total } = useCart();
  const subtotal = total();
  const [code, setCode] = React.useState("");

  // Discount state is hoisted to CheckoutView (single source of truth) so the
  // OrderSummary, the mobile sticky bar and the final PaymentStep charge all
  // agree on the same discounted total.
  const effectiveAppliedCode = appliedCode ?? null;
  const setAppliedCode = (next: string | null) => onApplyCode?.(next);
  const discountAmount = effectiveAppliedCode
    ? subtotal * (DISCOUNT_CODES[effectiveAppliedCode] ?? 0)
    : 0;
  const grand = Math.max(0, subtotal - discountAmount);

  const applyCode = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      showFloatingAlert("لطفاً یک کد تخفیف وارد کنید", "error");
      return;
    }
    if (!(trimmed.toUpperCase() in DISCOUNT_CODES)) {
      showFloatingAlert("کد تخفیف نامعتبر است", "error");
      return;
    }
    const normalized = trimmed.toUpperCase();
    setAppliedCode(normalized);
    const pct = Math.round(DISCOUNT_CODES[normalized] * 100);
    toast.success("کد تخفیف اعمال شد", {
      description: `${toFa(pct)}٪ تخفیف برای این سفارش`,
    });
  };

  return (
    <div className="space-y-4 rounded-3xl border bg-card p-5 shadow-lg shadow-forest/5 lg:sticky lg:top-24">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <ShoppingCart className="h-5 w-5 text-primary" />
        خلاصه سفارش
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">جمع کل ({toFa(items.length)} آیتم)</span>
          <span className="font-bold">{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-emerald">
            <span>تخفیف</span>
            <span className="font-bold">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="font-bold">مبلغ نهایی</span>
          <span className="text-xl font-extrabold text-primary">
            {formatCurrency(grand)}
          </span>
        </div>
      </div>

      {!effectiveAppliedCode ? (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد تخفیف"
            className="h-9 text-sm max-sm:h-11"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={applyCode}
            className="max-sm:h-11 max-sm:px-4"
          >
            اعمال
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald/30 bg-emerald/5 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald">
            <Check className="h-3.5 w-3.5" />
            {appliedCode}
          </span>
          <button
            onClick={() => {
              setAppliedCode(null);
              setCode("");
            }}
            className="text-[10px] text-muted-foreground hover:text-destructive"
          >
            حذف
          </button>
        </div>
      )}

      {onCheckout && (
        <Button
          onClick={onCheckout}
          size="lg"
          className="h-12 w-full rounded-2xl bg-primary text-base text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-emerald-dark"
        >
          {checkoutLabel ?? "ادامه"}
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
        پرداخت امن و رمزنگاری‌شده
      </div>
    </div>
  );
}

function CartStep({
  onNext,
  appliedCode,
  onApplyCode,
}: {
  onNext: () => void;
  appliedCode: string | null;
  onApplyCode: (code: string | null) => void;
}) {
  const { items, remove, updateQty } = useCart();
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">بررسی سبد خرید</h2>
          <Badge className="bg-primary/10 text-primary">
            {toFa(items.length)} آیتم
          </Badge>
        </div>
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              onRemove={() => {
                remove(item.id);
                toast("آیتم حذف شد", { description: item.title });
              }}
              onUpdateQty={(q) => updateQty(item.id, q)}
            />
          ))}
        </AnimatePresence>
      </div>
      <OrderSummary
        onCheckout={onNext}
        checkoutLabel="ادامه به اطلاعات مسافر"
        appliedCode={appliedCode}
        onApplyCode={onApplyCode}
      />
    </div>
  );
}

interface PassengerInfo {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  emergencyContact: string;
  address: string;
  notes: string;
  /** Structured delivery address (equipment orders only). */
  province: string;
  city: string;
  postalCode: string;
}

const IRAN_PROVINCES = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
];

/** Persian → Latin digits (postal-code validation accepts both layouts). */
const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

function InfoStep({
  info,
  setInfo,
  onNext,
  onBack,
  appliedCode,
  onApplyCode,
}: {
  info: PassengerInfo;
  setInfo: React.Dispatch<React.SetStateAction<PassengerInfo>>;
  onNext: () => void;
  onBack: () => void;
  appliedCode: string | null;
  onApplyCode: (code: string | null) => void;
}) {
  const { items } = useCart();
  const hasEquipment = items.some(
    (i) => i.type === "equipment-sale" || i.type === "equipment-rent"
  );
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!info.fullName.trim()) e.fullName = true;
    if (!info.phone.trim() || info.phone.length < 10) e.phone = true;
    if (!info.email.trim() || !info.email.includes("@")) e.email = true;
    if (!info.nationalId.trim() || info.nationalId.length < 8) e.nationalId = true;
    if (!info.emergencyContact.trim()) e.emergencyContact = true;
    if (hasEquipment && !info.address.trim()) e.address = true;
    if (hasEquipment && !info.province) e.province = true;
    if (hasEquipment && !info.city.trim()) e.city = true;
    if (
      hasEquipment &&
      (!info.postalCode.trim() || toEnDigits(info.postalCode).length !== 10)
    )
      e.postalCode = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    } else {
      toast.error("لطفاً تمام فیلدهای ضروری را تکمیل کنید");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">اطلاعات مسافر</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            برای تکمیل رزرو، لطفاً اطلاعات تماس خود را وارد کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-3xl border bg-card p-5 md:grid-cols-2">
          <Field
            label="نام و نام خانوادگی"
            icon={<User className="h-4 w-4" />}
            required
            error={errors.fullName}
          >
            <Input
              value={info.fullName}
              onChange={(e) => setInfo((s) => ({ ...s, fullName: e.target.value }))}
              placeholder="مثلاً: رضا احمدی"
              className="h-11 rounded-xl"
            />
          </Field>
          <Field
            label="شماره تماس"
            icon={<Phone className="h-4 w-4" />}
            required
            error={errors.phone}
          >
            <Input
              value={info.phone}
              onChange={(e) => setInfo((s) => ({ ...s, phone: e.target.value }))}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              className="h-11 rounded-xl"
              inputMode="tel"
            />
          </Field>
          <Field
            label="ایمیل"
            icon={<Mail className="h-4 w-4" />}
            required
            error={errors.email}
          >
            <Input
              value={info.email}
              onChange={(e) => setInfo((s) => ({ ...s, email: e.target.value }))}
              placeholder="you@example.com"
              className="h-11 rounded-xl"
              inputMode="email"
              dir="ltr"
            />
          </Field>
          <Field
            label="کد ملی"
            icon={<IdCard className="h-4 w-4" />}
            required
            error={errors.nationalId}
          >
            <Input
              value={info.nationalId}
              onChange={(e) => setInfo((s) => ({ ...s, nationalId: e.target.value }))}
              placeholder="کد ملی"
              className="h-11 rounded-xl"
              inputMode="numeric"
              dir="ltr"
            />
          </Field>
          <Field
            label="تلفن اضطراری"
            icon={<Phone className="h-4 w-4" />}
            required
            error={errors.emergencyContact}
          >
            <Input
              value={info.emergencyContact}
              onChange={(e) =>
                setInfo((s) => ({ ...s, emergencyContact: e.target.value }))
              }
              placeholder="شماره فرد همراه"
              className="h-11 rounded-xl"
              inputMode="tel"
            />
          </Field>
          {hasEquipment && (
            <>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="استان"
                    icon={<MapPin className="h-4 w-4" />}
                    required
                    error={errors.province}
                  >
                    <Select
                      value={info.province}
                      onValueChange={(v) =>
                        setInfo((s) => ({ ...s, province: v }))
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl bg-background max-sm:h-11">
                        <SelectValue placeholder="انتخاب استان" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {IRAN_PROVINCES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label="شهرستان"
                    icon={<Building2 className="h-4 w-4" />}
                    required
                    error={errors.city}
                  >
                    <Input
                      value={info.city}
                      onChange={(e) =>
                        setInfo((s) => ({ ...s, city: e.target.value }))
                      }
                      placeholder="مثلاً: تهران"
                      className="h-11 rounded-xl"
                    />
                  </Field>
                </div>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="آدرس دریافت تجهیزات"
                  icon={<MapPin className="h-4 w-4" />}
                  required
                  error={errors.address}
                >
                  <Textarea
                    value={info.address}
                    onChange={(e) =>
                      setInfo((s) => ({ ...s, address: e.target.value }))
                    }
                    placeholder="نشانی دقیق برای ارسال یا تحویل حضوری تجهیزات"
                    className="min-h-20 rounded-xl"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="کد پستی"
                  icon={<Package className="h-4 w-4" />}
                  required
                  error={errors.postalCode}
                  errorText="کد پستی باید ۱۰ رقم باشد"
                >
                  <Input
                    value={info.postalCode}
                    onChange={(e) =>
                      setInfo((s) => ({ ...s, postalCode: e.target.value }))
                    }
                    placeholder="مثلاً: ۱۳۹۷۶۴۳۵۹۱"
                    className="h-11 rounded-xl"
                    inputMode="numeric"
                    dir="ltr"
                  />
                </Field>
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <Field label="توضیحات (اختیاری)" icon={<AlertCircle className="h-4 w-4" />}>
              <Textarea
                value={info.notes}
                onChange={(e) => setInfo((s) => ({ ...s, notes: e.target.value }))}
                placeholder="هر نکته‌ای که باید بدانیم..."
                className="min-h-20 rounded-xl"
              />
            </Field>
          </div>
        </div>

        <div
          id="checkout-step-actions"
          className="flex items-center justify-between max-sm:flex-col max-sm:items-stretch max-sm:gap-3"
        >
          <Button variant="ghost" onClick={onBack} className="max-sm:h-11">
            <ChevronRight className="h-4 w-4" />
            بازگشت به سبد
          </Button>
          <Button
            onClick={handleNext}
            className="bg-primary text-primary-foreground max-sm:h-12 max-sm:w-full max-sm:text-base"
          >
            ادامه به پرداخت
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <OrderSummary appliedCode={appliedCode} onApplyCode={onApplyCode} />
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  error,
  errorText,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div
        className={cn(
          error &&
            "[&_input]:border-destructive [&_textarea]:border-destructive"
        )}
      >
        {children}
      </div>
      {error && (
        <p className="text-[11px] text-destructive">
          {errorText ?? "این فیلد الزامی است"}
        </p>
      )}
    </div>
  );
}

function PaymentStep({
  onNext,
  onBack,
  grand,
  appliedCode,
  onApplyCode,
}: {
  onNext: () => void;
  onBack: () => void;
  /** Discounted grand total from CheckoutView — keeps the charged amount in
   * sync with what OrderSummary displays (discount codes included). */
  grand: number;
  appliedCode: string | null;
  onApplyCode: (code: string | null) => void;
}) {
  const { items } = useCart();
  const [method, setMethod] = React.useState<"card" | "wallet">("card");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  // Booking/order stores — persist real purchase history
  const addBooking = useBookings((s) => s.addBooking);
  const addOrder = useOrders((s) => s.addOrder);
  const addSellerOrder = useSellerOrders((s) => s.addOrder);

  // Wallet — balance is read from the store (single source of truth) so the
  // payment option label and the balance check below always agree.
  const walletBalance = useWallet((s) => s.balance);
  const deductFromWallet = useWallet((s) => s.deduct);

  // Currently-authenticated user — used as the "customer" name on the
  // seller-side order mirror.
  const user = useAuth((s) => s.user);

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1-");
  };

  const handlePay = () => {
    if (method === "card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 16) {
        toast.error("شماره کارت نامعتبر است");
        return;
      }
      if (cvv.length < 3) {
        toast.error("CVV نامعتبر است");
        return;
      }
    }
    // Wallet balance check — block payment if the wallet can't cover it.
    if (method === "wallet" && grand > walletBalance) {
      showFloatingAlert("موجودی کیف پول شما کافی نیست", "error");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast.success("پرداخت با موفقیت انجام شد");

      // Deduct from wallet if paying with wallet.
      if (method === "wallet") {
        deductFromWallet(grand);
      }

      // Record each cart item as a booking (tour) or order (equipment)
      // so it shows up in the user dashboard.
      items.forEach((item) => {
        if (item.type === "tour") {
          // Look up leader name from tour mock data
          const tour = tours.find((t) => t.id === item.refId);
          addBooking({
            tourId: item.refId,
            tourTitle: item.title,
            tourImage: item.image,
            tourDate: item.meta?.startDate ?? new Date().toISOString(),
            participants: item.meta?.participants ?? item.quantity,
            totalPrice: item.unitPrice * item.quantity,
            status: "confirmed",
            leader: tour?.leader?.fullName ?? "—",
          });
          // XP (v19 بخش ۸): رزرو موفق = رویداد واقعی
          useXP.getState().addEvent("booking:created", { tourId: item.refId });
        } else {
          // equipment-sale or equipment-rent — mirror into BOTH the user
          // orders store and the seller orders store with a shared id so
          // status changes on either side propagate to the other.
          const sharedOrderId = `SO-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`;
          addOrder({
            items: item.title,
            total: item.unitPrice * item.quantity,
            date: new Date().toISOString(),
            status: "processing",
            sharedOrderId,
          });
          addSellerOrder({
            customer: user?.fullName ?? "کاربر مهمان",
            product: item.title,
            qty: item.quantity,
            total: item.unitPrice * item.quantity,
            status: "pending",
            date: new Date().toISOString(),
            type: item.type === "equipment-rent" ? "rent" : "sale",
            sharedOrderId,
          });
        }
      });

      onNext();
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">پرداخت</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            روش پرداخت مورد نظر را انتخاب کنید.
          </p>
        </div>

        <RadioGroup
          value={method}
          onValueChange={(v) => setMethod(v as "card" | "wallet")}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <PaymentMethodCard
            value="card"
            selected={method === "card"}
            icon={<CreditCard className="h-5 w-5" />}
            title="کارت بانکی"
            desc="پرداخت آنلاین از طریق درگاه امن"
          />
          <PaymentMethodCard
            value="wallet"
            selected={method === "wallet"}
            icon={<Wallet className="h-5 w-5" />}
            title="کیف پول کوچ‌نشین"
            desc={`موجودی: ${formatCurrency(walletBalance)}`}
          />
        </RadioGroup>

        <AnimatePresence mode="wait">
          {method === "card" && (
            <motion.div
              key="card-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-3xl border bg-card p-5">
                {/* Mock card visual */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-emerald-dark to-primary p-5 text-cream shadow-xl">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-70">کوچ‌نشین‌کارت</span>
                    <CreditCard className="h-6 w-6 opacity-70" />
                  </div>
                  <div className="my-5 h-8 w-12 rounded-md bg-gold/40" />
                  <p className="font-mono text-lg tracking-widest">
                    {cardNumber || "••••-••••-••••-••••"}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span>انقضا: {expiry || "--/--"}</span>
                    <span>CVV: {cvv ? "•••" : "---"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      شماره کارت
                    </Label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCard(e.target.value))}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="h-11 rounded-xl font-mono"
                      dir="ltr"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                        تاریخ انقضا
                      </Label>
                      <Input
                        value={expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                          setExpiry(v);
                        }}
                        placeholder="MM/YY"
                        className="h-11 rounded-xl font-mono"
                        dir="ltr"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                        CVV2
                      </Label>
                      <Input
                        value={cvv}
                        onChange={(e) =>
                          setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="••••"
                        className="h-11 rounded-xl font-mono"
                        dir="ltr"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-emerald" />
                  اطلاعات کارت شما رمزنگاری می‌شود و ذخیره نمی‌گردد.
                </p>
              </div>
            </motion.div>
          )}
          {method === "wallet" && (
            <motion.div
              key="wallet-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-3xl border bg-card p-5 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold">
                  <Wallet className="h-7 w-7" />
                </div>
                <p className="mt-3 font-bold">پرداخت از کیف پول</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  موجودی فعلی شما {formatCurrency(walletBalance)} است. مبلغ سفارش
                  از کیف پول شما کسر خواهد شد.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          id="checkout-step-actions"
          className="flex items-center justify-between max-sm:flex-col max-sm:items-stretch max-sm:gap-3"
        >
          <Button variant="ghost" onClick={onBack} className="max-sm:h-11">
            <ChevronRight className="h-4 w-4" />
            بازگشت
          </Button>
          <Button
            onClick={handlePay}
            disabled={processing}
            className="bg-primary text-primary-foreground max-sm:h-12 max-sm:w-full max-sm:text-base"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال پردازش...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                پرداخت {formatCurrency(grand)}
              </>
            )}
          </Button>
        </div>
      </div>

      <OrderSummary appliedCode={appliedCode} onApplyCode={onApplyCode} />
    </div>
  );
}

function PaymentMethodCard({
  value,
  selected,
  icon,
  title,
  desc,
}: {
  value: string;
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Label
      htmlFor={`pm-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition",
        selected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      <RadioGroupItem value={value} id={`pm-${value}`} className="mt-1" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <span className="font-bold">{title}</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </Label>
  );
}

function ConfirmStep({ bookingRef }: { bookingRef: string }) {
  const go = useGo();
  const { items, total } = useCart();
  const clear = useCart((s) => s.clear);

  // Print ONLY the receipt card: a body class switches the print stylesheet
  // into receipt mode (visibility trick — layout preserved, everything but
  // the receipt left unprinted), removed right after the print dialog.
  const printReceipt = React.useCallback(() => {
    document.body.classList.add("print-receipt-mode");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("print-receipt-mode");
    }, 400);
  }, []);

  // Snapshot the cart items once on mount. The clear() effect below wipes
  // the live cart after 1.5s, but the confirmation page should keep
  // displaying exactly what was purchased — so we render from this frozen
  // copy instead of from the live `items`.
  const [snapshotItems] = React.useState(items);
  const [snapshotTotal] = React.useState(() => total());

  React.useEffect(() => {
    const t = setTimeout(() => clear(), 1500);
    return () => clearTimeout(t);
  }, [clear]);

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald/15 text-emerald"
      >
        <Check className="h-12 w-12" strokeWidth={3} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <div className="flex items-center justify-center gap-2">
          <PartyPopper className="h-6 w-6 text-gold" />
          <h2 className="text-2xl font-extrabold md:text-3xl">سفر آماده است!</h2>
        </div>
        <p className="mt-2 text-muted-foreground">
          سفارش شما با موفقیت ثبت و پرداخت شد. جزئیات رزرو به داشبورد شما ارسال
          شد.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        id="receipt-card"
        className="mt-8 rounded-3xl border bg-card p-5 shadow-lg shadow-forest/5"
      >
        {/* Print-only receipt header (hidden on screen) */}
        <div className="hidden print:mb-4 print:block print:border-b print:pb-4 print:border-neutral-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-extrabold">کوچ‌نشین</p>
              <p className="text-xs text-neutral-500">
                پلتفرم تور و تجهیزات گردشگری ایران
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">رسید پرداخت سفارش</p>
              <p className="text-xs text-neutral-500">
                {toPersianDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:border-neutral-300">
          <div>
            <p className="text-xs text-muted-foreground">شماره رزرو</p>
            <p className="font-mono text-lg font-extrabold text-primary">
              {bookingRef}
            </p>
          </div>
          <Badge className="bg-emerald/10 text-emerald">
            <Check className="h-3 w-3" />
            تایید شده
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm font-bold">خلاصه سفارش:</p>
          <div className="custom-scroll max-h-56 space-y-2 overflow-y-auto">
            {snapshotItems.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-xl border bg-background p-2"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  <SmartImage
                    src={it.image}
                    alt={it.title}
                    fallback={it.type === "tour" ? "tour" : "equipment"}
                    shimmer={false}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{it.title}</p>
                  <CartItemMetaChips meta={it.meta} type={it.type} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {it.type === "tour"
                      ? "تور"
                      : it.type === "equipment-rent"
                      ? `اجاره ${toFa(it.meta?.rentDays ?? 1)} روزه`
                      : "خرید تجهیز"}
                    {" • "}
                    {toFa(it.quantity)} عدد
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(it.unitPrice * it.quantity)}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <span className="font-bold">مبلغ کل پرداخت‌شده</span>
            <span className="text-xl font-extrabold text-primary">
              {formatCurrency(snapshotTotal)}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-3 max-sm:flex-col max-sm:items-stretch"
      >
        <Button
          onClick={() => go("user-dashboard")}
          className="bg-primary text-primary-foreground max-sm:h-12 max-sm:w-full max-sm:text-base"
        >
          <LayoutDashboard className="h-4 w-4" />
          پیگیری سفارش در داشبورد
        </Button>
        <Button
          variant="outline"
          onClick={printReceipt}
          className="max-sm:h-12 max-sm:w-full max-sm:text-base"
        >
          <Printer className="h-4 w-4" />
          چاپ رسید
        </Button>
        <Button
          variant="outline"
          onClick={() => go("home")}
          className="max-sm:h-12 max-sm:w-full max-sm:text-base"
        >
          <HomeIcon className="h-4 w-4" />
          بازگشت به خانه
        </Button>
      </motion.div>
    </div>
  );
}

export function CheckoutView() {
  const { items, total, count } = useCart();
  const user = useAuth((s) => s.user);
  const [step, setStep] = React.useState(0);
  const [bookingRef] = React.useState(genBookingRef);
  // Discount code — single source of truth for the whole checkout flow so the
  // OrderSummary card, the mobile sticky bar and the charged amount agree.
  const [appliedCode, setAppliedCode] = React.useState<string | null>(null);
  const subtotal = total();
  const discountAmount = appliedCode
    ? subtotal * (DISCOUNT_CODES[appliedCode] ?? 0)
    : 0;
  const grand = Math.max(0, subtotal - discountAmount);
  const [info, setInfo] = React.useState<PassengerInfo>({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    nationalId: "",
    emergencyContact: "",
    address: "",
    notes: "",
    province: "",
    city: "",
    postalCode: "",
  });

  // If cart is empty and we're not on confirmation step, show empty state
  if (items.length === 0 && step < 3) {
    return <EmptyCartState />;
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-24 max-lg:pb-44">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Backpack className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-extrabold md:text-3xl">تسویه حساب</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {toFa(count())} آیتم • جمع کل:{" "}
              <span className="font-bold text-primary">
                {formatCurrency(total())}
              </span>
            </p>
          </div>
        </ScrollReveal>

        {/* Stepper */}
        {step < 3 && (
          <ScrollReveal delay={0.1}>
            <div className="mx-auto mb-10 max-w-3xl">
              <StepIndicator current={step} completed={step} />
            </div>
          </ScrollReveal>
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <CartStep
                onNext={() => setStep(1)}
                appliedCode={appliedCode}
                onApplyCode={setAppliedCode}
              />
            )}
            {step === 1 && (
              <InfoStep
                info={info}
                setInfo={setInfo}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
                appliedCode={appliedCode}
                onApplyCode={setAppliedCode}
              />
            )}
            {step === 2 && (
              <PaymentStep
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                grand={grand}
                appliedCode={appliedCode}
                onApplyCode={setAppliedCode}
              />
            )}
            {step === 3 && <ConfirmStep bookingRef={bookingRef} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile-only sticky summary bar (brief §16) — sits above the bottom
          nav; shows the live discounted total and, on the cart step, a
          shortcut CTA mirroring the OrderSummary action. Desktop ≥lg is
          served by the sticky OrderSummary column and is untouched. */}
      {items.length > 0 && step < 3 && (
        <CheckoutMobileBar
          step={step}
          grand={grand}
          onContinue={() => setStep(1)}
        />
      )}
    </div>
  );
}

// --- Mobile sticky summary bar (brief §16) --------------------------------

/**
 * Mobile-only (<lg) floating bar pinned above the bottom nav. Shows the live
 * discounted «مبلغ نهایی» throughout the whole flow. On the cart step it also
 * offers the same «ادامه» action as the OrderSummary card (no duplicated
 * validation logic — later steps keep their own validated CTAs and the bar
 * surfaces a trust/progress chip instead). Desktop uses the sticky summary
 * column and never renders this bar.
 */
function CheckoutMobileBar({
  step,
  grand,
  onContinue,
}: {
  step: number;
  grand: number;
  onContinue: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="نوار خلاصه پرداخت"
      className="fixed inset-x-3 z-40 lg:hidden bottom-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="flex items-center justify-between gap-3 rounded-2xl border bg-background/90 px-4 py-2.5 shadow-xl shadow-forest/10 backdrop-blur-xl"
      >
        <div className="min-w-0">
          <p className="text-[10px] leading-4 text-muted-foreground">
            مبلغ نهایی
          </p>
          <motion.p
            key={grand}
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="truncate text-base font-extrabold text-primary"
          >
            {formatCurrency(grand)}
          </motion.p>
        </div>

        {step === 0 ? (
          <Button
            onClick={onContinue}
            className="h-11 shrink-0 rounded-xl bg-primary px-6 text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-emerald-dark"
          >
            ادامه
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-2 text-[11px] font-bold text-emerald">
            <ShieldCheck className="h-3.5 w-3.5" />
            پرداخت امن • مرحله {toFa(step + 1)} از {toFa(3)}
          </div>
        )}
      </motion.div>
    </div>
  );
}
