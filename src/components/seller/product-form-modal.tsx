"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  Check,
  Tag,
  Package,
  Plus,
  Trash2,
  ShieldCheck,
  Upload,
  Mountain,
  Tent,
  Shirt,
  Briefcase,
} from "lucide-react";
import { useDraftProducts, type DraftProduct } from "@/store/draft-products-store";
import { toFa } from "@/lib/format";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EquipmentProduct, ProductCondition } from "@/types";

// Sample image URLs (self-hosted equipment photos) — used as a quick-pick gallery
const SAMPLE_IMAGES = [
  "/images/equipment/tent-1.jpg",
  "/images/equipment/tent-2.jpg",
  "/images/equipment/backpack-1.jpg",
  "/images/equipment/backpack-2.jpg",
  "/images/equipment/boots-1.jpg",
  "/images/equipment/sleeping-1.jpg",
  "/images/equipment/jacket-1.jpg",
  "/images/equipment/stove-1.jpg",
  "/images/equipment/headlamp-1.jpg",
  "/images/equipment/rope-1.jpg",
];

const CATEGORIES: { value: EquipmentProduct["category"]; label: string }[] = [
  { value: "mountaineering", label: "کوهنوردی" },
  { value: "camping", label: "کمپینگ" },
  { value: "clothing", label: "پوشاک" },
  { value: "travel-gear", label: "ابزار سفر" },
];

// Category → icon component mapping (used for the empty-state placeholder
// in step 3 when no image has been selected yet).
const CATEGORY_ICONS: Record<EquipmentProduct["category"], typeof Mountain> = {
  mountaineering: Mountain,
  camping: Tent,
  clothing: Shirt,
  "travel-gear": Briefcase,
};

// Maximum size (in bytes) for an uploaded image file. 2MB keeps the
// localStorage payload manageable (images are stored as base64 data URLs).
const MAX_FILE_SIZE = 2 * 1024 * 1024;

interface FormState {
  title: string;
  brand: string;
  category: EquipmentProduct["category"];
  condition: ProductCondition;
  description: string;
  availableForSale: boolean;
  availableForRent: boolean;
  price: number;
  rentPricePerDay: number;
  stock: number;
  images: string[];
  specs: { label: string; value: string }[];
}

const EMPTY_FORM: FormState = {
  title: "",
  brand: "",
  category: "camping",
  condition: "new",
  description: "",
  availableForSale: true,
  availableForRent: false,
  price: 0,
  rentPricePerDay: 0,
  stock: 1,
  images: [],
  specs: [],
};

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  editProduct?: DraftProduct | null;
}

export function ProductFormModal({
  open,
  onClose,
  sellerId,
  editProduct,
}: ProductFormModalProps) {
  const { addProduct, updateProduct } = useDraftProducts();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [customImageUrl, setCustomImageUrl] = React.useState("");
  // Validation: when `touched` is true, field-level error UI lights up
  // for any invalid input on the current step. Reset to false on a
  // successful `handleNext` so the next step starts in a clean state.
  const [touched, setTouched] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper for updating a single form field without breaking memoisation.
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  React.useEffect(() => {
    if (open) {
      if (editProduct) {
        setForm({
          title: editProduct.title,
          brand: editProduct.brand,
          category: editProduct.category,
          condition: editProduct.condition,
          description: editProduct.description,
          availableForSale: editProduct.availableForSale,
          availableForRent: editProduct.availableForRent,
          price: editProduct.price,
          rentPricePerDay: editProduct.rentPricePerDay ?? 0,
          stock: editProduct.stock,
          images: editProduct.images,
          specs: editProduct.specs,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setStep(1);
      setCustomImageUrl("");
      setTouched(false);
    }
  }, [open, editProduct]);

  const isEditing = !!editProduct;

  const step1Valid = form.title.trim().length >= 3 && form.brand.trim().length >= 2;
  const step2Valid =
    (form.availableForSale || form.availableForRent) &&
    (!form.availableForSale || form.price > 0) &&
    (!form.availableForRent || form.rentPricePerDay > 0) &&
    form.stock >= 0;
  const step3Valid = form.images.length >= 1;

  const canGoNext = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;

  // Field-level error flags (only displayed when `touched` is true).
  const titleError = form.title.trim().length < 3;
  const brandError = form.brand.trim().length < 2;
  const priceError = form.availableForSale && form.price <= 0;
  const rentPriceError = form.availableForRent && form.rentPricePerDay <= 0;
  const stockError = form.stock < 0;
  const imagesError = form.images.length === 0;

  const handleNext = () => {
    setTouched(true);
    if (!canGoNext) {
      toast.error("لطفاً همه فیلدهای ضروری را پر کنید");
      return;
    }
    setTouched(false);
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("حجم فایل باید کمتر از ۲ مگابایت باشد");
      // Reset input value so the same file can be re-selected after fixing.
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((f) => ({ ...f, images: [...f.images, dataUrl] }));
      toast.success("تصویر اضافه شد");
    };
    reader.onerror = () => {
      toast.error("خطا در بارگذاری تصویر");
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be selected again later.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!step3Valid) {
      toast.error("حداقل یک تصویر انتخاب کنید");
      return;
    }
    const productData = {
      ...form,
      sellerId,
      status: "active" as const,
      rating: editProduct?.rating ?? 5,
    };

    if (isEditing && editProduct) {
      updateProduct(editProduct.id, productData);
      toast.success("محصول به‌روزرسانی شد", { description: form.title });
    } else {
      addProduct(productData);
      toast.success("محصول منتشر شد", { description: form.title });
    }
    onClose();
  };

  const toggleImage = (url: string) => {
    setForm((f) => ({
      ...f,
      images: f.images.includes(url)
        ? f.images.filter((u) => u !== url)
        : [...f.images, url],
    }));
  };

  const addCustomImage = () => {
    const url = customImageUrl.trim();
    if (!url) return;
    if (form.images.includes(url)) {
      toast.error("این تصویر قبلاً اضافه شده");
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setCustomImageUrl("");
  };

  const addSpec = () => {
    setForm((f) => ({
      ...f,
      specs: [...f.specs, { label: "", value: "" }],
    }));
  };

  const updateSpec = (i: number, field: "label" | "value", val: string) => {
    setForm((f) => ({
      ...f,
      specs: f.specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)),
    }));
  };

  const removeSpec = (i: number) => {
    setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-forest/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl border bg-background shadow-2xl"
            >
              {/* Header — only title + close button. The step indicators
                  were moved out of the header (they used to overlap with
                  the absolutely-positioned close button in RTL). The new
                  progress bar sits in its own full-width row below. */}
              <div className="flex items-center justify-between border-b bg-gradient-to-l from-emerald to-emerald-dark p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {isEditing ? "ویرایش محصول" : "افزودن محصول جدید"}
                    </h3>
                    <p className="text-[11px] text-white/70">
                      مرحله {toFa(step)} از {toFa(3)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Step progress bar — full-width row below the header.
                  Replaces the inline dot indicators that overlapped with
                  the close button in RTL layouts. */}
              <div className="flex items-center gap-1.5 bg-emerald-dark/50 px-5 py-2.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all",
                      s === step ? "bg-gold" : s < step ? "bg-white" : "bg-white/25",
                    )}
                  />
                ))}
              </div>

              {/* Body */}
              <div className="custom-scroll max-h-[calc(92vh-13rem)] overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {/* Step 1 */}
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h4 className="text-lg font-extrabold">اطلاعات پایه</h4>
                        <p className="text-sm text-muted-foreground">
                          نام، برند و دسته‌بندی محصول
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold text-muted-foreground">
                            نام محصول *
                          </label>
                          <input
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="مثال: چادر کمپ دو نفره حرفه‌ای"
                            className={cn(
                              "h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none",
                              touched && titleError && "border-destructive focus:border-destructive",
                            )}
                          />
                          {touched && titleError && (
                            <p className="mt-1 text-xs text-destructive">
                              نام محصول باید حداقل ۳ حرف باشد
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-muted-foreground">
                            برند *
                          </label>
                          <input
                            value={form.brand}
                            onChange={(e) => set("brand", e.target.value)}
                            placeholder="مثال: نورت‌فیس"
                            className={cn(
                              "h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none",
                              touched && brandError && "border-destructive focus:border-destructive",
                            )}
                          />
                          {touched && brandError && (
                            <p className="mt-1 text-xs text-destructive">
                              برند باید حداقل ۲ حرف باشد
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-muted-foreground">
                            دسته‌بندی *
                          </label>
                          <select
                            value={form.category}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                category: e.target.value as EquipmentProduct["category"],
                              }))
                            }
                            className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-muted-foreground">
                            وضعیت *
                          </label>
                          <div className="flex gap-2">
                            {(["new", "used"] as ProductCondition[]).map((c) => (
                              <button
                                key={c}
                                onClick={() =>
                                  setForm((f) => ({ ...f, condition: c }))
                                }
                                className={cn(
                                  "flex-1 rounded-xl border py-2.5 text-sm font-bold transition",
                                  form.condition === c
                                    ? "border-emerald bg-emerald/10 text-emerald"
                                    : "border-border text-muted-foreground hover:border-emerald/40"
                                )}
                              >
                                {c === "new" ? "نو" : "دست دوم"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">
                          توضیحات
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, description: e.target.value }))
                          }
                          placeholder="توضیحات کامل محصول، ویژگی‌ها و کاربرد..."
                          rows={4}
                          className="w-full rounded-xl border bg-background p-4 text-sm focus:border-emerald focus:outline-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <motion.div
                      key="s2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h4 className="text-lg font-extrabold">قیمت‌گذاری و موجودی</h4>
                        <p className="text-sm text-muted-foreground">
                          حداقل یکی از گزینه‌های فروش یا اجاره باید فعال باشد
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              availableForSale: !f.availableForSale,
                            }))
                          }
                          className={cn(
                            "flex items-center justify-between rounded-2xl border-2 p-4 transition",
                            form.availableForSale
                              ? "border-emerald bg-emerald/5"
                              : "border-border hover:border-emerald/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "grid h-8 w-8 place-items-center rounded-lg",
                                form.availableForSale
                                  ? "bg-emerald text-white"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              <Tag className="h-4 w-4" />
                            </div>
                            <span className="font-bold">قابل فروش</span>
                          </div>
                          <div
                            className={cn(
                              "relative h-5 w-9 rounded-full transition",
                              form.availableForSale ? "bg-emerald" : "bg-secondary"
                            )}
                          >
                            <div
                              className={cn(
                                "absolute h-4 w-4 rounded-full bg-white transition-all",
                                form.availableForSale ? "right-0.5 top-0.5" : "right-4 top-0.5"
                              )}
                            />
                          </div>
                        </button>
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              availableForRent: !f.availableForRent,
                            }))
                          }
                          className={cn(
                            "flex items-center justify-between rounded-2xl border-2 p-4 transition",
                            form.availableForRent
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "grid h-8 w-8 place-items-center rounded-lg",
                                form.availableForRent
                                  ? "bg-accent text-white"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="font-bold">قابل اجاره</span>
                          </div>
                          <div
                            className={cn(
                              "relative h-5 w-9 rounded-full transition",
                              form.availableForRent ? "bg-accent" : "bg-secondary"
                            )}
                          >
                            <div
                              className={cn(
                                "absolute h-4 w-4 rounded-full bg-white transition-all",
                                form.availableForRent ? "right-0.5 top-0.5" : "right-4 top-0.5"
                              )}
                            />
                          </div>
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {form.availableForSale && (
                          <div>
                            <label className="mb-1 block text-xs font-bold text-muted-foreground">
                              قیمت فروش (تومان) *
                            </label>
                            <input
                              type="number"
                              value={form.price || ""}
                              onChange={(e) =>
                                set("price", Number(e.target.value) || 0)
                              }
                              placeholder="مثال: ۲۸۵۰۰۰۰"
                              className={cn(
                                "h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none",
                                touched && priceError && "border-destructive focus:border-destructive",
                              )}
                            />
                            {touched && priceError && (
                              <p className="mt-1 text-xs text-destructive">
                                قیمت فروش باید بزرگ‌تر از صفر باشد
                              </p>
                            )}
                          </div>
                        )}
                        {form.availableForRent && (
                          <div>
                            <label className="mb-1 block text-xs font-bold text-muted-foreground">
                              قیمت اجاره روزانه (تومان) *
                            </label>
                            <input
                              type="number"
                              value={form.rentPricePerDay || ""}
                              onChange={(e) =>
                                set("rentPricePerDay", Number(e.target.value) || 0)
                              }
                              placeholder="مثال: ۹۵۰۰۰"
                              className={cn(
                                "h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none",
                                touched && rentPriceError && "border-destructive focus:border-destructive",
                              )}
                            />
                            {touched && rentPriceError && (
                              <p className="mt-1 text-xs text-destructive">
                                قیمت اجاره باید بزرگ‌تر از صفر باشد
                              </p>
                            )}
                          </div>
                        )}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-muted-foreground">
                            موجودی انبار *
                          </label>
                          <input
                            type="number"
                            value={form.stock}
                            onChange={(e) =>
                              set("stock", Number(e.target.value) || 0)
                            }
                            placeholder="مثال: ۱۰"
                            className={cn(
                              "h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-emerald focus:outline-none",
                              touched && stockError && "border-destructive focus:border-destructive",
                            )}
                          />
                          {touched && stockError && (
                            <p className="mt-1 text-xs text-destructive">
                              موجودی نمی‌تواند منفی باشد
                            </p>
                          )}
                        </div>
                        {touched && !form.availableForSale && !form.availableForRent && (
                          <p className="sm:col-span-2 text-xs text-destructive">
                            حداقل یکی از گزینه‌های «قابل فروش» یا «قابل اجاره» باید فعال باشد
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <motion.div
                      key="s3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h4 className="text-lg font-extrabold">تصاویر و مشخصات فنی</h4>
                        <p className="text-sm text-muted-foreground">
                          حداقل ۱ تصویر انتخاب کن ({toFa(form.images.length)} انتخاب شده)
                        </p>
                        {touched && imagesError && (
                          <p className="mt-1 text-xs text-destructive">
                            حداقل یک تصویر انتخاب کنید
                          </p>
                        )}
                      </div>

                      {form.images.length === 0 ? (
                        // Empty-state placeholder: dashed-border card with the
                        // category icon (Mountain / Tent / Shirt / Briefcase)
                        // so the form feels less blank before any image is
                        // picked or uploaded.
                        <div className="grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-muted-foreground">
                          {(() => {
                            const Icon = CATEGORY_ICONS[form.category];
                            return <Icon className="h-12 w-12" />;
                          })()}
                          <p className="text-sm text-center">
                            هنوز تصویری انتخاب نشده — یکی از گزینه‌های زیر را
                            انتخاب یا آپلود کنید
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 rounded-xl border border-emerald/30 bg-emerald/5 p-3">
                          {form.images.map((url) => (
                            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                              <SmartImage
                                src={url}
                                alt="selected"
                                fallback="equipment"
                                shimmer={false}
                                aspectClass="size-full"
                                className="object-cover"
                              />
                              <button
                                onClick={() => toggleImage(url)}
                                className="absolute left-0 top-0 grid h-5 w-5 place-items-center rounded-br-lg bg-destructive text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload from local filesystem (base64 via FileReader).
                          The hidden input is triggered by the visible button. */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      <div>
                        <p className="mb-2 text-xs font-bold text-muted-foreground">
                          انتخاب از گالری نمونه یا آپلود از سیستم
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {SAMPLE_IMAGES.map((url) => {
                            const selected = form.images.includes(url);
                            return (
                              <button
                                key={url}
                                onClick={() => toggleImage(url)}
                                className={cn(
                                  "relative h-16 w-16 overflow-hidden rounded-lg border-2 transition",
                                  selected
                                    ? "border-emerald ring-2 ring-emerald/30"
                                    : "border-transparent hover:border-emerald/40"
                                )}
                              >
                                <SmartImage
                                  src={url}
                                  alt="sample"
                                  fallback="equipment"
                                  shimmer={false}
                                  aspectClass="size-full"
                                  className="object-cover"
                                />
                                {selected && (
                                  <div className="absolute inset-0 grid place-items-center bg-emerald/30">
                                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {/* Upload button — opens native file picker */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-emerald/40 text-emerald transition hover:bg-emerald/5"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-[9px]">آپلود</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold text-muted-foreground">
                          یا URL تصویر دلخواه
                        </p>
                        <div className="flex gap-2">
                          <input
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            placeholder="https://..."
                            dir="ltr"
                            className="h-10 flex-1 rounded-xl border bg-background px-3 text-right text-sm focus:border-emerald focus:outline-none"
                          />
                          <Button
                            onClick={addCustomImage}
                            variant="outline"
                            className="gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            افزودن
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-bold text-muted-foreground">
                            مشخصات فنی (اختیاری)
                          </p>
                          <button
                            onClick={addSpec}
                            className="flex items-center gap-1 text-xs font-bold text-emerald transition hover:text-emerald-dark"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            افزودن ردیف
                          </button>
                        </div>
                        <div className="space-y-2">
                          {form.specs.length === 0 && (
                            <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                              هنوز مشخصاتی اضافه نشده
                            </p>
                          )}
                          {form.specs.map((spec, i) => (
                            <div key={i} className="flex gap-2">
                              <input
                                value={spec.label}
                                onChange={(e) => updateSpec(i, "label", e.target.value)}
                                placeholder="عنوان (مثال: وزن)"
                                className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm focus:border-emerald focus:outline-none"
                              />
                              <input
                                value={spec.value}
                                onChange={(e) => updateSpec(i, "value", e.target.value)}
                                placeholder="مقدار (مثال: ۲.۵ کیلوگرم)"
                                className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm focus:border-emerald focus:outline-none"
                              />
                              <button
                                onClick={() => removeSpec(i)}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-destructive transition hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t bg-card p-4">
                {step > 1 ? (
                  <Button
                    onClick={() => setStep((s) => s - 1)}
                    variant="outline"
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                    قبلی
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      canGoNext ? "text-emerald" : "text-muted-foreground"
                    )}
                  >
                    {canGoNext ? "✓ آماده" : "کامل کنید"}
                  </span>
                  {step < 3 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className="gap-1 bg-emerald text-white"
                    >
                      مرحله بعد
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!step3Valid}
                      className="gap-1 bg-emerald text-white"
                    >
                      <Check className="h-4 w-4" />
                      {isEditing ? "ذخیره تغییرات" : "انتشار محصول"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
