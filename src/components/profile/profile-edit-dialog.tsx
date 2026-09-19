"use client";

import * as React from "react";
import {
  Camera,
  Crop,
  PencilLine,
  Trash2,
  UserRound,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BIO_MAX = 200;
/** خروجی برش — مربع ۳۲۰×۳۲۰ (پیکسل) با کیفیت ۸۵٪ */
const EXPORT_SIZE = 320;
/** سقف حجم فایل آپلودی */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** بازه‌ی لغزنده‌ی بزرگ‌نمایی */
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

interface CropImg {
  src: string;
  nw: number;
  nh: number;
}

/**
 * دیالوگ مشترک «ویرایش پروفایل» — کاربرِ واردشده را ویرایش می‌کند.
 *
 * از همه‌ی پنل‌ها باز می‌شود (پروفایل من، داشبورد لیدر و تنظیمات فروشنده)
 * تا ویرایش عکس/بیوگرافی/شهر برای همه‌ی نقش‌ها یکسان و در یک جا متمرکز باشد.
 *
 * آپلود عکس با برش سفارشی: فایل → حالت برش (درگ برای جابه‌جایی + لغزنده‌ی
 * زوم + ماسک دایره‌ای) → خروجی مربع ۳۲۰px روی canvas → dataURL در استور کاربر.
 */
export function ProfileEditDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useAuth((s) => s.user);
  const updateUser = useAuth((s) => s.updateUser);

  // ---- فرم ----
  const [fullName, setFullName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [city, setCity] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [nameError, setNameError] = React.useState(false);
  /** آواتار پیش‌نویس: string = عکس جدید، null = حذف عکس */
  const [avatarDraft, setAvatarDraft] = React.useState<string | null>(null);

  // ---- حالت برش ----
  const [crop, setCrop] = React.useState<CropImg | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const dragRef = React.useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const centeredRef = React.useRef(false);
  /** اندازه‌ی واقعی (px) ویوپورت مربع برش — واکنش‌گرا اندازه‌گیری می‌شود */
  const [vp, setVp] = React.useState(280);

  // هر بار که دیالوگ باز می‌شود، فرم از داده‌ی فعلی کاربر پر می‌شود
  React.useEffect(() => {
    if (!open) return;
    setFullName(user?.fullName ?? "");
    setBio(user?.bio ?? "");
    setCity(user?.city ?? "");
    setPhone(user?.phone ?? "");
    setEmail(user?.email ?? "");
    setAvatarDraft(user?.avatar ?? null);
    setNameError(false);
    setCrop(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [open, user]);

  // اندازه‌گیری ویوپورت برش (واکنش‌گرا در موبایل/دسکتاپ)
  React.useLayoutEffect(() => {
    if (!crop) return;
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setVp(el.clientWidth || 280);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [crop]);

  const baseScale = crop ? Math.max(vp / crop.nw, vp / crop.nh) : 1;
  const dispW = crop ? crop.nw * baseScale * zoom : 0;
  const dispH = crop ? crop.nh * baseScale * zoom : 0;

  const clampOffset = React.useCallback(
    (x: number, y: number, dW: number, dH: number, size: number) => ({
      x: Math.min(0, Math.max(size - dW, x)),
      y: Math.min(0, Math.max(size - dH, y)),
    }),
    [],
  );

  // نگه‌داشتن تصویر همیشه پوشاننده‌ی ویوپورت؛ اولین بار وسط‌چین
  React.useEffect(() => {
    if (!crop || vp <= 0) return;
    setOffset((o) => {
      if (!centeredRef.current) {
        centeredRef.current = true;
        return clampOffset((vp - dispW) / 2, (vp - dispH) / 2, dispW, dispH, vp);
      }
      return clampOffset(o.x, o.y, dispW, dispH, vp);
    });
  }, [crop, vp, zoom, dispW, dispH, clampOffset]);

  const openFilePicker = () => fileRef.current?.click();

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری انتخاب کن (JPG، PNG و…)");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("حجم عکس باید کمتر از ۵ مگابایت باشد");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("خواندن فایل ممکن نشد");
    reader.onload = () => {
      const src = String(reader.result ?? "");
      if (!src) return;
      const img = new Image();
      img.onerror = () => toast.error("این عکس باز نشد؛ فایل دیگری امتحان کن");
      img.onload = () => {
        centeredRef.current = false;
        setCrop({ src, nw: img.naturalWidth || 1, nh: img.naturalHeight || 1 });
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ---- درگ برای جابه‌جایی عکس داخل قاب ----
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    // اگر capture ممکن نشد (مثلاً pointerId معتبر نیست) درگ همچنان با
    // رویدادهای move روی خودِ عنصر کار می‌کند — کافی است کرش نکند.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || !crop) return;
    const next = clampOffset(
      d.ox + (e.clientX - d.px),
      d.oy + (e.clientY - d.py),
      dispW,
      dispH,
      vp,
    );
    setOffset(next);
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  /** برش نهایی روی canvas → dataURL مربع ۳۲۰px */
  const confirmCrop = () => {
    if (!crop) return;
    const img = new Image();
    img.onerror = () => toast.error("ثبت برش ممکن نشد؛ دوباره تلاش کن");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("ثبت برش ممکن نشد؛ دوباره تلاش کن");
        return;
      }
      // پس‌زمینه‌ی سفید تا عکس‌های شفاف سیاه نشوند
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      const ratio = crop.nw / dispW; // نسبت پیکسل طبیعی به نمایش‌داده‌شده
      const sx = -offset.x * ratio;
      const sy = -offset.y * ratio;
      const s = vp * ratio;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
      setAvatarDraft(canvas.toDataURL("image/jpeg", 0.85));
      setCrop(null);
    };
    img.src = crop.src;
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      setNameError(true);
      return;
    }
    updateUser({
      fullName: fullName.trim(),
      bio: bio.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatar: avatarDraft ?? undefined,
    });
    toast.success("پروفایل به‌روزرسانی شد");
    onOpenChange(false);
  };

  const previewAvatar = avatarDraft ?? user?.avatar ?? null;
  const initialChar = (fullName.trim() || user?.fullName || "؟").charAt(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto rounded-3xl border-border/60 sm:max-w-md">
        {crop ? (
          <>
            {/* ===== حالت برش عکس ===== */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gold/10 text-gold">
                  <Crop className="h-4 w-4" />
                </span>
                برش عکس پروفایل
              </DialogTitle>
              <DialogDescription>
                عکس را با انگشت یا موس جابه‌جا کن و با لغزنده بزرگ‌نمایی کن؛
                دایره نشان می‌دهد چه بخشی در نهایت ذخیره می‌شود.
              </DialogDescription>
            </DialogHeader>

            <div className="mx-auto w-full max-w-[288px]">
              <div
                ref={viewportRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="relative aspect-square w-full cursor-grab touch-none select-none overflow-hidden rounded-3xl border border-border/60 bg-muted active:cursor-grabbing"
                role="application"
                aria-label="قاب برش عکس — برای جابه‌جایی بکش"
              >
                <img
                  src={crop.src}
                  alt="پیش‌نمایش برش عکس پروفایل"
                  draggable={false}
                  className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
                  style={{
                    width: `${dispW}px`,
                    height: `${dispH}px`,
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                  }}
                />
                {/* ماسک دایره‌ای — بیرون دایره تیره می‌شود */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/85 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]" />
                </div>
              </div>

              {/* لغزنده‌ی بزرگ‌نمایی */}
              <div className="mt-4 flex items-center gap-3">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <Slider
                  value={[zoom]}
                  min={ZOOM_MIN}
                  max={ZOOM_MAX}
                  step={0.01}
                  onValueChange={(vals) => setZoom(vals[0] ?? ZOOM_MIN)}
                  aria-label="بزرگ‌نمایی عکس"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setCrop(null)}
                className="min-h-11 rounded-2xl"
              >
                بازگشت
              </Button>
              <Button
                onClick={confirmCrop}
                className="min-h-11 rounded-2xl bg-primary text-primary-foreground"
              >
                <Crop className="h-4 w-4" />
                برش و ثبت
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* ===== فرم ویرایش پروفایل ===== */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gold/10 text-gold">
                  <UserRound className="h-4 w-4" />
                </span>
                ویرایش پروفایل
              </DialogTitle>
              <DialogDescription>
                این اطلاعات در پروفایل عمومی تو دیده می‌شود؛ شماره موبایل و ایمیل
                هرگز به دیگران نمایش داده نمی‌شود.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              {/* آواتار + بارگذاری با برش */}
              <div className="flex flex-col items-center gap-2.5">
                <div className="relative">
                  <Avatar className="h-20 w-20 rounded-3xl ring-2 ring-gold/40">
                    {previewAvatar ? (
                      <AvatarImage src={previewAvatar} alt="عکس پروفایل" />
                    ) : (
                      <AvatarFallback className="rounded-3xl bg-gold/15 text-2xl font-bold text-gold">
                        {initialChar}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    aria-label="بارگذاری عکس پروفایل"
                    title="بارگذاری عکس پروفایل"
                    className="absolute -bottom-1.5 -left-1.5 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition hover:bg-emerald-dark active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="min-h-6 text-[11px] font-bold text-primary transition hover:underline"
                  >
                    بارگذاری عکس
                  </button>
                  {previewAvatar && (
                    <>
                      <span aria-hidden className="text-border">·</span>
                      <button
                        type="button"
                        onClick={() => setAvatarDraft(null)}
                        className={cn(
                          "inline-flex min-h-6 items-center gap-1 text-[11px] font-bold text-destructive transition hover:underline",
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف عکس
                      </button>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-edit-name">نام و نام خانوادگی</Label>
                <Input
                  id="profile-edit-name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError && e.target.value.trim()) setNameError(false);
                  }}
                  placeholder="مثلاً: سارا احمدی"
                  aria-invalid={nameError}
                  className="min-h-11 rounded-2xl bg-background"
                />
                {nameError && (
                  <p className="text-[11px] font-bold text-destructive">
                    نام و نام خانوادگی را وارد کنید
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="profile-edit-bio">بیوگرافی</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {toFa(bio.length)} از {toFa(BIO_MAX)}
                  </span>
                </div>
                <Textarea
                  id="profile-edit-bio"
                  rows={3}
                  maxLength={BIO_MAX}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="مثلاً: کوهنورد و کمپر؛ عاشق سفرهای سبک و کم‌جمعیت"
                  className="rounded-2xl bg-background"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-edit-city">شهرستان</Label>
                <Input
                  id="profile-edit-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثلاً: مشهد"
                  className="min-h-11 rounded-2xl bg-background"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="profile-edit-phone">شماره موبایل</Label>
                  <Input
                    id="profile-edit-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    inputMode="tel"
                    className="min-h-11 rounded-2xl bg-background text-right"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="profile-edit-email">ایمیل</Label>
                  <Input
                    id="profile-edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="min-h-11 rounded-2xl bg-background text-right"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-h-11 rounded-2xl"
              >
                انصراف
              </Button>
              <Button
                onClick={handleSave}
                className="min-h-11 rounded-2xl bg-primary text-primary-foreground"
              >
                <PencilLine className="h-4 w-4" />
                ذخیره تغییرات
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
