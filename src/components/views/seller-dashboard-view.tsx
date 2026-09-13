"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Settings,
  DollarSign,
  Bell,
  ChevronLeft,
  Copy,
  Search,
  Tag,
  X,
  MessageSquare,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useDraftProducts, type DraftProduct } from "@/store/draft-products-store";
import { useSellerOrders, type SellerOrder } from "@/store/seller-orders-store";
import { useSellerProfile } from "@/store/seller-profile-store";
import { useEquipmentReviews } from "@/store/equipment-reviews-store";
import { equipment } from "@/mocks/equipment";
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
import { IconTooltip } from "@/components/common/icon-tooltip";
import { ProductFormModal } from "@/components/seller/product-form-modal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { EquipmentProduct } from "@/types";

type TabKey = "overview" | "products" | "orders" | "reviews" | "settings";

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof Store }[] = [
  { key: "overview", label: "داشبورد", icon: Store },
  { key: "products", label: "محصولات", icon: Package },
  { key: "orders", label: "سفارش‌ها", icon: ShoppingCart },
  { key: "reviews", label: "نظرات", icon: MessageSquare },
  { key: "settings", label: "تنظیمات", icon: Settings },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Check }
> = {
  confirmed: { label: "تایید شده", color: "text-emerald", bg: "bg-emerald/10", icon: Check },
  pending: { label: "در انتظار", color: "text-gold", bg: "bg-gold/10", icon: Clock },
  cancelled: { label: "لغو شده", color: "text-destructive", bg: "bg-destructive/10", icon: AlertCircle },
};

export function SellerDashboardView() {
  const { user, isAuthenticated, role } = useAuth();
  const go = useGo();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const [tab, setTab] = React.useState<TabKey>("overview");

  // Form modal state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<DraftProduct | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<DraftProduct | null>(null);

  const sellerId = user?.id ?? "";
  // Hooks must be called unconditionally (before any early return).
  // Note: we read `products` (the raw array) via selector and filter
  // client-side — calling `getBySeller()` inside a selector causes an
  // infinite loop because it returns a new array reference each render.
  const allDraftProducts = useDraftProducts((s) => s.products);
  const draftProducts = React.useMemo(
    () => allDraftProducts.filter((p) => p.sellerId === sellerId),
    [allDraftProducts, sellerId],
  );
  const { addProduct, removeProduct, duplicateProduct } = useDraftProducts();
  const orders = useSellerOrders((s) => s.orders);
  const confirmOrder = useSellerOrders((s) => s.confirmOrder);
  const cancelOrder = useSellerOrders((s) => s.cancelOrder);
  // Reviews for the seller's products (draft + mock equipment ids).
  const allReviews = useEquipmentReviews((s) => s.reviews);
  const replyToReview = useEquipmentReviews((s) => s.replyToReview);

  // IDs of all products "owned" by this seller — used to filter reviews.
  // Includes both the seller's draft products and the 8 mock equipment
  // items (mocks are shared site-wide but the seller dashboard treats
  // them as if they belong to the current seller for demo purposes).
  // Computed before the early return so hooks below stay unconditional.
  const mockProducts = equipment.slice(0, 8);
  const myProductIds = React.useMemo(
    () => [...draftProducts.map((p) => p.id), ...mockProducts.map((p) => p.id)],
    [draftProducts, mockProducts],
  );
  const myReviewsCount = React.useMemo(
    () => allReviews.filter((r) => myProductIds.includes(r.productId)).length,
    [allReviews, myProductIds],
  );

  if (!isAuthenticated || role !== "seller") {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-background pt-24 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-emerald/10 text-emerald">
            <Store className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold">پنل فروشنده</h2>
          <p className="mt-2 text-muted-foreground">
            برای دسترسی به پنل فروشنده، ابتدا به عنوان فروشنده وارد شو.
          </p>
          <Button
            onClick={() => setAuthOpen(true)}
            className="mt-6 bg-emerald text-white"
          >
            ورود به عنوان فروشنده
          </Button>
        </div>
      </div>
    );
  }

  // Combine draft products (real, user-created) + mock equipment for display
  const allProducts = [...draftProducts, ...mockProducts];
  // Track which IDs are "real" (editable) vs "mock" (display-only)
  const draftIds = new Set(draftProducts.map((p) => p.id));

  const totalRevenue = orders
    .filter((o) => o.status === "confirmed")
    .reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const openAddForm = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  const openEditForm = (product: DraftProduct) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleEdit = (productId: string) => {
    const draft = draftProducts.find((p) => p.id === productId);
    if (draft) {
      openEditForm(draft);
      return;
    }
    // Mock product: create an editable copy owned by this seller, then
    // open the edit form on the new copy. This gives the seller a clear
    // "you can personalise this" experience instead of an error toast.
    const mock = mockProducts.find((p) => p.id === productId);
    if (!mock) {
      toast.error("محصول یافت نشد");
      return;
    }
    const newId = addProduct({
      title: mock.title,
      brand: mock.brand,
      category: mock.category,
      condition: mock.condition,
      description: mock.description,
      availableForSale: mock.availableForSale,
      availableForRent: mock.availableForRent,
      price: mock.price,
      rentPricePerDay: mock.rentPricePerDay ?? 0,
      stock: mock.stock,
      images: mock.images,
      specs: mock.specs,
      sellerId,
      status: "active",
      rating: mock.rating,
    });
    const newDraft = allDraftProducts.find((p) => p.id === newId) ?? null;
    if (newDraft) {
      // addProduct prepends, so the new draft should already be in
      // allDraftProducts on the next render — but we can also open the
      // form with the data we just pushed. Use setEditProduct with the
      // freshly-created object to avoid waiting a render cycle.
      setEditProduct(newDraft);
      setFormOpen(true);
    } else {
      // Fallback: open the form with the new product's id resolved on
      // next render. Construct the DraftProduct inline so the form has
      // all the fields it needs.
      setEditProduct({
        ...mock,
        id: newId,
        sellerId,
        createdAt: new Date().toISOString(),
        status: "active",
      });
      setFormOpen(true);
    }
    toast.info("یک نسخه‌ی قابل‌ویرایش از این محصول برایتان ساخته شد");
  };

  const handleDelete = (productId: string) => {
    const draft = draftProducts.find((p) => p.id === productId);
    if (!draft) {
      toast.error("این محصول نمایشی است و قابل حذف نیست");
      return;
    }
    setDeleteTarget(draft);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      removeProduct(deleteTarget.id);
      toast.success("محصول حذف شد", { description: deleteTarget.title });
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = (productId: string) => {
    const newId = duplicateProduct(productId);
    if (newId) {
      toast.success("کپی محصول ساخته شد", {
        description: "نسخه کپی با پسوند (کپی) اضافه شد",
      });
    } else {
      toast.error("فقط محصولات خودتان قابل کپی هستند");
    }
  };

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
            <span className="font-bold text-foreground">پنل فروشنده</span>
          </nav>
        </ScrollReveal>

        {/* Header */}
        <ScrollReveal y={12} className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white shadow-lg shadow-emerald/20">
                <Store className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold md:text-3xl">
                  سلام، {user?.fullName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  فروشگاه تجهیزات کوهستان — {toFa(allProducts.length)} محصول فعال
                </p>
              </div>
            </div>
            <div className="flex gap-2 max-sm:flex-col">
              <Button
                onClick={() => go("equipment")}
                variant="outline"
                className="gap-1.5"
              >
                <Eye className="h-4 w-4" />
                مشاهده فروشگاه
              </Button>
              <Button
                onClick={openAddForm}
                className="gap-1.5 bg-emerald text-white"
              >
                <Plus className="h-4 w-4" />
                افزودن محصول
              </Button>
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
                      ? "bg-background text-emerald shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.key === "orders" && pendingOrders > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                      {toFa(pendingOrders)}
                    </span>
                  )}
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
            {tab === "overview" && (
              <OverviewTab
                products={allProducts}
                orders={orders}
                totalRevenue={totalRevenue}
                pendingOrders={pendingOrders}
                myReviewsCount={myReviewsCount}
              />
            )}
            {tab === "products" && (
              <ProductsTab
                products={allProducts}
                draftIds={draftIds}
                draftCount={draftProducts.length}
                onAdd={openAddForm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            )}
            {tab === "orders" && (
              <OrdersTab
                orders={orders}
                onConfirm={(id) => {
                  confirmOrder(id);
                  toast.success("سفارش تایید شد");
                }}
                onCancel={(id, reason) => {
                  cancelOrder(id, reason);
                  toast.info("سفارش لغو شد");
                }}
              />
            )}
            {tab === "reviews" && (
              <ReviewsTab
                myProductIds={myProductIds}
                products={allProducts}
                onReply={(reviewId, text) => {
                  replyToReview(reviewId, text);
                  toast.success("پاسخ شما ثبت شد");
                }}
              />
            )}
            {tab === "settings" && <SettingsTab sellerId={sellerId} userName={user?.fullName ?? ""} userPhone={user?.phone ?? ""} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Product form modal */}
      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        sellerId={sellerId}
        editProduct={editProduct}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محصول</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستی که می‌خواهی «{deleteTarget?.title}» را حذف کنی؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Overview Tab ---

/** تولتیپ RTL نمودار روند فروش فروشنده (ماه + مبلغ + تعداد سفارش). */
function SalesTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: MonthlyTrendPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    // نمودار در ظرف dir="ltr" رندر می‌شود؛ بدون rtl متن فارسی برعکس خوانده می‌شد.
    <div dir="rtl" className="glass rounded-xl border border-border/60 px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-foreground">{p.label}</div>
      <div className="mt-1 font-bold text-emerald">{formatCurrency(p.revenue)}</div>
      <div className="text-[10px] text-muted-foreground">{toFa(p.count)} سفارش</div>
      {p.isBest && <div className="mt-0.5 text-[10px] font-bold text-gold">★ بهترین ماه</div>}
    </div>
  );
}

function OverviewTab({
  products,
  orders,
  totalRevenue,
  pendingOrders,
  myReviewsCount,
}: {
  products: (DraftProduct | EquipmentProduct)[];
  orders: SellerOrder[];
  totalRevenue: number;
  pendingOrders: number;
  myReviewsCount: number;
}) {
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const avgRatingValue = products.length
    ? products.reduce((s, p) => s + p.rating, 0) / products.length
    : 0;
  // یک رقم اعشار — تنها آماری که مجاز به اعشار است (v25)
  const avgRating = avgRatingValue.toFixed(1);

  // نمودار روند فروش — داده‌محور از سفارش‌های واقعی (v25)
  const trend = React.useMemo(
    () => buildMonthlyTrend(totalRevenue, totalOrders, "seller-sales-trend", 6),
    [totalRevenue, totalOrders]
  );
  const growth = trendGrowthPercent(trend);
  const avgMonthly = Math.round(trend.reduce((s, p) => s + p.revenue, 0) / trend.length);
  const bestMonth = trend.find((p) => p.isBest);

  const stats = [
    {
      label: "درآمد کل",
      value: totalRevenue,
      format: (v: number) => formatCurrency(v),
      icon: DollarSign,
      color: "text-emerald",
      bg: "bg-emerald/10",
      trend: `${growth >= 0 ? "+" : ""}${toFa(growth)}٪ ماه جاری`,
      trendUp: growth >= 0,
      decimals: 0,
    },
    {
      label: "سفارش‌ها",
      value: totalOrders,
      format: (v: number) => toFa(v),
      icon: ShoppingCart,
      color: "text-accent",
      bg: "bg-accent/10",
      trend: `${toFa(pendingOrders)} در انتظار`,
      trendUp: true,
      decimals: 0,
    },
    {
      label: "محصولات فعال",
      value: totalProducts,
      format: (v: number) => toFa(v),
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: "همه فعال",
      trendUp: true,
      decimals: 0,
    },
    {
      label: "امتیاز میانگین",
      value: Number(avgRating),
      format: (v: number) => toFa(v.toFixed(1)),
      icon: Star,
      color: "text-gold",
      bg: "bg-gold/10",
      trend: `${toFa(myReviewsCount)} نظر`,
      trendUp: true,
      decimals: 1,
    },
  ];

  return (
    <div className="space-y-6">
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
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-emerald/60 via-primary/50 to-gold/60" />
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
                <Counter to={stat.value} format={stat.format} decimals={stat.decimals} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <ShoppingCart className="h-5 w-5 text-emerald" />
              سفارش‌های اخیر
            </h3>
            <span className="text-xs text-muted-foreground">{toFa(orders.length)} سفارش</span>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 p-3 transition hover:border-emerald/30"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{order.product}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer} • {toPersianShortDate(order.date)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald">{formatCurrency(order.total)}</p>
                    <span className={cn("flex items-center gap-1 text-[10px] font-bold", cfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-accent" />
            پرفروش‌ترین محصولات
          </h3>
          <div className="space-y-3">
            {products.slice(0, 4).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                  {toFa(i + 1)}
                </span>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <SmartImage src={p.images[0]} alt={p.title} fallback="equipment" shimmer={false} aspectClass="size-full" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(p.price)}</p>
                </div>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-gold">
                  <Star className="h-3 w-3 fill-current" />
                  {toFa(p.rating)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* روند فروش — داده‌محور با تولتیپ، میانگین و بهترین ماه (v25) */}
      <div className="rounded-3xl border bg-card p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-emerald" />
            روند فروش (۶ ماه اخیر)
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
          فروش ماهانه بر پایه {toFa(totalOrders)} سفارش ثبت‌شده — روی هر ستون بروید تا مبلغ دقیق را ببینید.
        </p>
        <div className="h-52 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="sellerSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="sellerSalesBestGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0c14b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d4a017" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={<SalesTooltip />}
              />
              <ReferenceLine
                y={avgMonthly}
                stroke="var(--muted-foreground)"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={44}>
                {trend.map((p, i) => (
                  <Cell
                    key={i}
                    fill={p.isBest ? "url(#sellerSalesBestGrad)" : "url(#sellerSalesGrad)"}
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
            <span className="font-bold">{formatCurrency(avgMonthly)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gold/25 bg-gold/5 px-3 py-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-gold" />
              بهترین ماه
            </span>
            <span className="font-bold text-gold">
              {bestMonth ? `${bestMonth.label} — ${formatCurrency(bestMonth.revenue)}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald/25 bg-emerald/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">درآمد کل تأییدشده</span>
            <span className="font-bold text-emerald">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Products Tab ---

function ProductsTab({
  products,
  draftIds,
  draftCount,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  products: (DraftProduct | EquipmentProduct)[];
  draftIds: Set<string>;
  draftCount: number;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  // فیلترهای فروشگاه — سایدبار هم‌سان با صفحه تجهیزات (درخواست کاربر)
  const [category, setCategory] = React.useState<string>("all");
  const [condition, setCondition] = React.useState<"all" | "new" | "used">("all");
  const [availability, setAvailability] = React.useState<"all" | "sale" | "rent">("all");
  const [sort, setSort] = React.useState<"popular" | "price-asc" | "price-desc" | "rating">("popular");
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  // null = «همه قیمت‌ها» (اسلایدر دست‌نخورده — سقف خودکار از محصولات)
  const [priceRange, setPriceRange] = React.useState<[number, number] | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const allBrands = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  );
  // سقف اسلایدر = گران‌ترین محصول، گردشده به بالا در میلیون
  const priceCeiling = React.useMemo(
    () =>
      Math.ceil(Math.max(1_000_000, ...products.map((p) => p.price)) / 1_000_000) *
      1_000_000,
    [products],
  );
  const effectivePriceRange = priceRange ?? ([0, priceCeiling] as [number, number]);

  const filtered = React.useMemo(() => {
    let result = products.slice();
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      );
    }
    if (category !== "all") result = result.filter((p) => p.category === category);
    if (condition !== "all") result = result.filter((p) => p.condition === condition);
    if (availability === "sale") result = result.filter((p) => p.availableForSale);
    if (availability === "rent") result = result.filter((p) => p.availableForRent);
    if (selectedBrands.length > 0)
      result = result.filter((p) => selectedBrands.includes(p.brand));
    result = result.filter(
      (p) => p.price >= effectivePriceRange[0] && p.price <= effectivePriceRange[1],
    );
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [products, search, category, condition, availability, sort, selectedBrands, effectivePriceRange]);

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (condition !== "all" ? 1 : 0) +
    (availability !== "all" ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    selectedBrands.length +
    (priceRange !== null ? 1 : 0);

  const resetProductFilters = () => {
    setSearch("");
    setCategory("all");
    setCondition("all");
    setAvailability("all");
    setSort("popular");
    setSelectedBrands([]);
    setPriceRange(null);
  };

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  const PRODUCT_CATEGORIES: { k: string; l: string }[] = [
    { k: "all", l: "همه دسته‌ها" },
    { k: "mountaineering", l: "کوهنوردی" },
    { k: "camping", l: "کمپینگ" },
    { k: "clothing", l: "پوشاک" },
    { k: "travel-gear", l: "تجهیزات سفر" },
  ];

  /** بخش‌های فیلتر — مشترک بین سایدبار دسکتاپ و شیت موبایل؛ ساختار
   *  هم‌سان با FilterPanel صفحه تجهیزات (جستجو + دسته‌بندی + وضعیت +
   *  دسترسی + مرتب‌سازی + قیمت + برندها + ریست). */
  const renderFilterSections = () => (
    <div className="space-y-6">
      {/* جستجو */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی محصول یا برند..."
          className="h-10 w-full rounded-xl border bg-background pr-10 pl-9 text-sm focus:border-emerald focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="پاک کردن جستجو"
            className="absolute left-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* دسته‌بندی — لیست عمودی با شمارنده */}
      <div>
        <h5 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Tag className="h-4 w-4 text-emerald" />
          دسته‌بندی
        </h5>
        <div className="space-y-1.5">
          {PRODUCT_CATEGORIES.map((c) => {
            const count =
              c.k === "all"
                ? products.length
                : products.filter((p) => p.category === c.k).length;
            const active = category === c.k;
            return (
              <button
                key={c.k}
                onClick={() => setCategory(c.k)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition",
                  active
                    ? "border-emerald bg-emerald/10 text-emerald"
                    : "border-border text-muted-foreground hover:border-emerald/40",
                )}
              >
                <span>{c.l}</span>
                <span className={cn("text-[10px]", active ? "text-emerald" : "text-muted-foreground")}>
                  {toFa(count)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* وضعیت */}
      <div>
        <h5 className="mb-3 text-sm font-bold">وضعیت</h5>
        <div className="grid grid-cols-3 gap-2">
          {(["all", "new", "used"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={cn(
                "rounded-xl border py-2 text-xs font-bold transition max-sm:min-h-11",
                condition === c
                  ? "border-emerald bg-emerald/10 text-emerald"
                  : "border-border text-muted-foreground hover:border-emerald/40",
              )}
            >
              {c === "all" ? "همه" : c === "new" ? "نو" : "دست دوم"}
            </button>
          ))}
        </div>
      </div>

      {/* نوع دسترسی */}
      <div>
        <h5 className="mb-3 text-sm font-bold">نوع دسترسی</h5>
        <div className="grid grid-cols-3 gap-2">
          {(["all", "sale", "rent"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAvailability(a)}
              className={cn(
                "rounded-xl border py-2 text-xs font-bold transition max-sm:min-h-11",
                availability === a
                  ? "border-emerald bg-emerald/10 text-emerald"
                  : "border-border text-muted-foreground hover:border-emerald/40",
              )}
            >
              {a === "all" ? "همه" : a === "sale" ? "خرید" : "اجاره"}
            </button>
          ))}
        </div>
      </div>

      {/* مرتب‌سازی */}
      <div>
        <h5 className="mb-3 text-sm font-bold">مرتب‌سازی</h5>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">محبوب‌ترین</SelectItem>
            <SelectItem value="price-asc">ارزان‌ترین</SelectItem>
            <SelectItem value="price-desc">گران‌ترین</SelectItem>
            <SelectItem value="rating">بالاترین امتیاز</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* حد قیمت */}
      <div>
        <h5 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <DollarSign className="h-4 w-4 text-emerald" />
          حد قیمت
        </h5>
        <Slider
          min={0}
          max={priceCeiling}
          step={250_000}
          value={effectivePriceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          className="mt-2"
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{formatCurrency(effectivePriceRange[0])}</span>
          <span>{formatCurrency(effectivePriceRange[1])}</span>
        </div>
      </div>

      {/* برندها — کامل باز شده (بدون اسکرول داخلی، مثل صفحه تجهیزات) */}
      <div>
        <h5 className="mb-3 text-sm font-bold">برندها</h5>
        <div className="space-y-2">
          {allBrands.map((b) => (
            <div key={b} className="flex items-center gap-2">
              <Checkbox
                id={`seller-brand-${b}`}
                checked={selectedBrands.includes(b)}
                onCheckedChange={() => toggleBrand(b)}
              />
              <label
                htmlFor={`seller-brand-${b}`}
                className="flex w-full cursor-pointer items-center justify-between text-sm"
              >
                <span>{b}</span>
                <span className="text-[11px] text-muted-foreground">
                  {toFa(products.filter((p) => p.brand === b).length)}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={resetProductFilters}>
        <X className="h-4 w-4" /> حذف همه فیلترها
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold">
          محصولات من ({toFa(products.length)})
          {draftCount > 0 && (
            <Badge variant="secondary" className="mr-2 bg-emerald/10 text-emerald">
              {toFa(draftCount)} محصول شما
            </Badge>
          )}
        </h3>
        <div className="flex gap-2">
          {/* Mobile filter trigger — مثل صفحه تجهیزات */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-1.5 lg:hidden max-sm:h-11 max-sm:px-4">
                <SlidersHorizontal className="h-4 w-4" />
                فیلترها
                {activeFilterCount > 0 && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald text-[10px] font-bold text-white">
                    {toFa(activeFilterCount)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto max-lg:max-w-full">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-emerald" />
                  فیلتر محصولات
                </SheetTitle>
              </SheetHeader>
              <div className="mt-2 pb-6">{renderFilterSections()}</div>
            </SheetContent>
          </Sheet>
          <Button
            onClick={onAdd}
            className="shrink-0 gap-1.5 bg-emerald text-white"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">افزودن محصول</span>
          </Button>
        </div>
      </div>

      {/* دو ستونه: سایدبار فیلتر + شبکه محصولات — هم‌سان با صفحه تجهیزات */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar — دسکتاپ. مثل سایدبار تورها/تجهیزات: پنل استاتیک در
            جای طبیعی خودش — بدون sticky و بدون اسکرول داخلی. */}
        <aside className="hidden lg:block">
          <div className="glass rounded-3xl border border-border/60 p-5 shadow-lg shadow-forest/5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald/10 text-emerald">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                فیلترها
              </h4>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald">
                  {toFa(activeFilterCount)} فعال
                </span>
              )}
            </div>
            {renderFilterSections()}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">{toFa(filtered.length)} محصول</span>
              {activeFilterCount > 0 && (
                <>
                  <Badge className="bg-emerald/10 text-emerald">
                    {toFa(activeFilterCount)} فیلتر فعال
                  </Badge>
                  <button
                    onClick={resetProductFilters}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive transition hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                    پاک کردن
                  </button>
                </>
              )}
            </div>
          </div>

      {filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border py-16 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
            <Package className="h-10 w-10" />
          </div>
          <div>
            <p className="font-bold">
              {search || activeFilterCount > 0 ? "نتیجه‌ای یافت نشد" : "هنوز محصولی اضافه نکرده‌اید"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || activeFilterCount > 0
                ? "فیلترها را تغییر دهید یا پاک کنید"
                : "اولین محصول خود را اضافه کنید تا فروش را شروع کنی"}
            </p>
          </div>
          {search || activeFilterCount > 0 ? (
            <Button onClick={resetProductFilters} variant="outline" className="gap-1.5">
              <X className="h-4 w-4" />
              پاک کردن فیلترها
            </Button>
          ) : (
            <Button onClick={onAdd} className="gap-1.5 bg-emerald text-white">
              <Plus className="h-4 w-4" />
              افزودن اولین محصول
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => {
            const isDraft = draftIds.has(p.id);
            const lowStock = p.stock <= 2;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="group overflow-hidden rounded-2xl border bg-card transition hover:border-emerald/30 hover:shadow-lg"
              >
                <div className="relative h-32 overflow-hidden">
                  <SmartImage
                    src={p.images[0]}
                    alt={p.title}
                    fallback="equipment"
                    shimmer={false}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
                  {/* Stock badge */}
                  <span
                    className={cn(
                      "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      lowStock
                        ? "bg-accent text-white"
                        : p.stock > 5
                          ? "bg-emerald text-white"
                          : "bg-gold text-forest",
                    )}
                  >
                    {lowStock
                      ? "موجودی کم"
                      : p.stock > 5
                        ? `${toFa(p.stock)} موجود`
                        : `تنها ${toFa(p.stock)} عدد`}
                  </span>
                  {/* "محصول شما" badge for draft products */}
                  {isDraft && (
                    <span className="absolute right-2 top-2 rounded-full bg-emerald/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      محصول شما
                    </span>
                  )}
                  {/* Action buttons — only for draft (user-created) products */}
                  {isDraft && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <IconTooltip label="ویرایش" side="top">
                        <button
                          onClick={() => onEdit(p.id)}
                          className="relative grid h-7 w-7 place-items-center rounded-lg bg-background/90 text-foreground backdrop-blur transition hover:bg-emerald hover:text-white max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </IconTooltip>
                      <IconTooltip label="کپی" side="top">
                        <button
                          onClick={() => onDuplicate(p.id)}
                          className="relative grid h-7 w-7 place-items-center rounded-lg bg-background/90 text-foreground backdrop-blur transition hover:bg-gold hover:text-forest max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </IconTooltip>
                      <IconTooltip label="حذف" side="top">
                        <button
                          onClick={() => onDelete(p.id)}
                          className="relative grid h-7 w-7 place-items-center rounded-lg bg-background/90 text-foreground backdrop-blur transition hover:bg-destructive hover:text-white max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </IconTooltip>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-muted-foreground">{p.brand}</p>
                  <p className="line-clamp-1 text-sm font-bold">{p.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-emerald">{formatCurrency(p.price)}</span>
                    <span className="flex items-center gap-0.5 text-xs">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {toFa(p.rating)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {p.availableForSale && (
                      <Badge variant="secondary" className="bg-emerald/10 text-emerald">فروش</Badge>
                    )}
                    {p.availableForRent && (
                      <Badge variant="secondary" className="bg-accent/10 text-accent">اجاره</Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Orders Tab ---

const CANCEL_REASONS = [
  "عدم موجودی کالا",
  "قیمت اشتباه ثبت شده",
  "مشکل در ارسال به این منطقه",
  "درخواست لغو از طرف مشتری",
  "سایر (توضیح دهید)",
] as const;

function OrdersTab({
  orders,
  onConfirm,
  onCancel,
}: {
  orders: SellerOrder[];
  onConfirm: (id: string) => void;
  onCancel: (id: string, reason: string) => void;
}) {
  const [filter, setFilter] = React.useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // Cancel-with-reason dialog state
  const [cancelTarget, setCancelTarget] = React.useState<SellerOrder | null>(null);
  const [cancelReasonKey, setCancelReasonKey] = React.useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = React.useState("");

  const openCancelDialog = (order: SellerOrder) => {
    setCancelTarget(order);
    setCancelReasonKey(CANCEL_REASONS[0]);
    setCustomReason("");
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const isOther = cancelReasonKey === "سایر (توضیح دهید)";
    const reason = isOther ? customReason.trim() : cancelReasonKey;
    if (isOther && !reason) {
      toast.error("لطفاً دلیل لغو را وارد کنید");
      return;
    }
    onCancel(cancelTarget.id, reason || cancelReasonKey);
    setCancelTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex max-sm:flex-col max-sm:items-start max-sm:gap-2 items-center justify-between">
        <h3 className="text-lg font-bold">سفارش‌ها ({toFa(filtered.length)})</h3>
        <div className="flex gap-1 rounded-xl bg-secondary p-1 max-sm:flex-wrap max-sm:w-full">
          {([
            { key: "all", label: "همه" },
            { key: "pending", label: "در انتظار" },
            { key: "confirmed", label: "تایید شده" },
            { key: "cancelled", label: "لغو شده" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition max-sm:py-2",
                filter === f.key ? "bg-background text-emerald shadow-sm" : "text-muted-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-emerald/30 hover:shadow-sm"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                  {order.type === "rent" ? <Calendar className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{order.product}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{order.customer}</span>
                    <span>•</span>
                    <span>{toPersianShortDate(order.date)}</span>
                    <span>•</span>
                    <span>{order.type === "rent" ? "اجاره" : "خرید"}</span>
                    <span>•</span>
                    <span>{toFa(order.qty)} عدد</span>
                  </div>
                  {order.status === "cancelled" && order.cancelReason && (
                    <p className="mt-1 text-[11px] text-destructive">
                      دلیل لغو: {order.cancelReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:gap-x-2 max-sm:gap-y-1">
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-emerald">{formatCurrency(order.total)}</p>
                    <span className={cn("flex items-center gap-1 text-[10px] font-bold", cfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  {order.status === "pending" && (
                    <div className="flex gap-1">
                      <IconTooltip label="تایید سفارش" side="top">
                        <button
                          onClick={() => onConfirm(order.id)}
                          className="relative grid h-8 w-8 place-items-center rounded-lg bg-emerald text-white transition hover:bg-emerald-dark max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </IconTooltip>
                      <IconTooltip label="لغو سفارش" side="top">
                        <button
                          onClick={() => openCancelDialog(order)}
                          className="relative grid h-8 w-8 place-items-center rounded-lg border border-destructive/30 text-destructive transition hover:bg-destructive hover:text-white max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </IconTooltip>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Cancel-with-reason dialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>لغو سفارش</AlertDialogTitle>
            <AlertDialogDescription>
              لطفاً دلیل لغو این سفارش را انتخاب کنید. این دلیل برای مشتری نیز نمایش داده می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup
            value={cancelReasonKey}
            onValueChange={setCancelReasonKey}
            className="gap-2"
          >
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition",
                  cancelReasonKey === reason
                    ? "border-destructive/40 bg-destructive/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-destructive/30",
                )}
              >
                <RadioGroupItem value={reason} className="border-destructive/40 text-destructive" />
                <span className="font-semibold">{reason}</span>
              </label>
            ))}
          </RadioGroup>
          {cancelReasonKey === "سایر (توضیح دهید)" && (
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="دلیل لغو را شرح دهید..."
              rows={3}
              className="resize-none"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              لغو سفارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Settings Tab ---

function SettingsTab({
  sellerId,
  userName,
  userPhone,
}: {
  sellerId: string;
  userName: string;
  userPhone: string;
}) {
  const profileStore = useSellerProfile();
  const existing = profileStore.profiles[sellerId];

  const [storeName, setStoreName] = React.useState(existing?.storeName ?? "تجهیزات کوهستان");
  const [description, setDescription] = React.useState(
    existing?.description ?? "فروش و اجاره تجهیزات کوهنوردی، کمپینگ و طبیعت‌گردی",
  );
  const [email, setEmail] = React.useState(existing?.email ?? "");
  const [address, setAddress] = React.useState(existing?.address ?? "");
  const [discountCode, setDiscountCode] = React.useState(existing?.discountCode ?? "");

  const handleSave = () => {
    profileStore.saveProfile({
      sellerId,
      storeName,
      description,
      email,
      address,
      discountCode,
    });
    toast.success("تغییرات ذخیره شد", {
      description: "پروفایل فروشگاه به‌روزرسانی شد",
    });
  };

  const handleGenerateCode = () => {
    const code = profileStore.generateDiscountCode(sellerId);
    setDiscountCode(code);
    toast.success("کد تخفیف ساخته شد", { description: code });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h3 className="text-lg font-bold">تنظیمات فروشگاه</h3>

      {/* Profile */}
      <div className="rounded-3xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald/10 text-emerald">
            <Store className="h-7 w-7" />
          </div>
          <div>
            <p className="font-bold">{userName}</p>
            <p className="text-xs text-muted-foreground">فروشنده تجهیزات</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">نام فروشنده</label>
            <input
              value={userName}
              disabled
              className="h-10 w-full rounded-xl border bg-secondary px-3 text-sm text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">شماره موبایل</label>
            <input
              value={userPhone}
              disabled
              dir="ltr"
              className="h-10 w-full rounded-xl border bg-secondary px-3 text-right text-sm text-muted-foreground"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-muted-foreground">نام فروشگاه</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-emerald focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-muted-foreground">توضیحات فروشگاه</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border bg-background p-3 text-sm focus:border-emerald focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">ایمیل</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              placeholder="email@example.com"
              className="h-10 w-full rounded-xl border bg-background px-3 text-right text-sm focus:border-emerald focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">آدرس</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="شهر، خیابان..."
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-emerald focus:outline-none"
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="mt-4 bg-emerald text-white"
        >
          ذخیره تغییرات
        </Button>
      </div>

      {/* Discount code */}
      <div className="rounded-3xl border bg-card p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold">
          <Tag className="h-5 w-5 text-emerald" />
          کد تخفیف فروشگاه
        </h4>
        <p className="mb-3 text-sm text-muted-foreground">
          یک کد تخفیف اختصاصی برای مشتریان خودت بساز. این کد کاملاً نمایشی است.
        </p>
        <div className="flex items-center gap-2 max-sm:flex-wrap">
          <input
            value={discountCode}
            readOnly
            placeholder="هنوز ساخته نشده"
            dir="ltr"
            className={cn(
              "h-11 min-w-0 flex-1 rounded-xl border bg-background px-4 text-right font-mono text-sm font-bold",
              discountCode ? "border-emerald text-emerald" : "text-muted-foreground",
            )}
          />
          {discountCode && (
            <IconTooltip label="کپی کد" side="top">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(discountCode);
                  toast.success("کپی شد", { description: discountCode });
                }}
                className="grid h-11 w-11 place-items-center rounded-xl border transition hover:bg-secondary"
              >
                <Copy className="h-4 w-4" />
              </button>
            </IconTooltip>
          )}
          <Button
            onClick={handleGenerateCode}
            variant="outline"
            className="gap-1.5"
          >
            <Tag className="h-4 w-4" />
            {discountCode ? "کد جدید" : "ساخت کد"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-3xl border bg-card p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold">
          <Bell className="h-5 w-5 text-emerald" />
          اعلان‌ها
        </h4>
        <div className="space-y-3">
          {[
            { label: "سفارش جدید", desc: "وقتی سفارش جدید ثبت می‌شود" },
            { label: "نظر جدید", desc: "وقتی روی محصولت نظر ثبت می‌شود" },
            { label: "موجودی کم", desc: "وقتی موجودی محصول کم می‌شود" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-secondary peer-checked:bg-emerald peer-focus:ring-2 peer-focus:ring-emerald/20" />
                <div className="pointer-events-none absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:-translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Reviews Tab ---

function ReviewsTab({
  myProductIds,
  products,
  onReply,
}: {
  myProductIds: string[];
  products: (DraftProduct | EquipmentProduct)[];
  onReply: (reviewId: string, text: string) => void;
}) {
  const allReviews = useEquipmentReviews((s) => s.reviews);
  const myReviews = React.useMemo(
    () => allReviews.filter((r) => myProductIds.includes(r.productId)),
    [allReviews, myProductIds],
  );

  // Look up product title by id (for the review card header).
  const productTitleById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.title);
    return map;
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="flex max-sm:flex-col max-sm:items-start max-sm:gap-1 items-center justify-between">
        <h3 className="text-lg font-bold">
          نظرات محصولات ({toFa(myReviews.length)})
        </h3>
        <p className="text-xs text-muted-foreground">
          فقط نظرات مربوط به محصولات شما
        </p>
      </div>

      {myReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border py-16 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
            <MessageSquare className="h-10 w-10" />
          </div>
          <div>
            <p className="font-bold">هنوز نظری ثبت نشده</p>
            <p className="mt-1 text-sm text-muted-foreground">
              وقتی مشتریان روی محصولاتت نظر بدهند، اینجا نمایش داده می‌شود
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {myReviews.map((review, i) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald/10 text-emerald">
                    <span className="text-sm font-bold">
                      {review.author.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{review.author}</p>
                      <span className="flex items-center gap-0.5 text-xs text-gold">
                        <Star className="h-3 w-3 fill-gold" />
                        {toFa(review.rating)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {toPersianShortDate(review.date)}
                      </span>
                    </div>
                    {productTitleById.has(review.productId) && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        روی محصول:{" "}
                        <span className="font-semibold text-foreground">
                          {productTitleById.get(review.productId)}
                        </span>
                      </p>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {review.comment}
                    </p>

                    {review.sellerReply ? (
                      <div className="mt-3 rounded-xl border border-emerald/30 bg-emerald/5 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald">
                          <Send className="h-3.5 w-3.5" />
                          پاسخ شما
                          <span className="text-[10px] font-normal text-muted-foreground">
                            • {toPersianShortDate(review.sellerReply.date)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed">
                          {review.sellerReply.text}
                        </p>
                      </div>
                    ) : (
                      <ReviewReplyBox
                        reviewId={review.id}
                        onReply={onReply}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ReviewReplyBox({
  reviewId,
  onReply,
}: {
  reviewId: string;
  onReply: (reviewId: string, text: string) => void;
}) {
  const [text, setText] = React.useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onReply(reviewId, trimmed);
    setText("");
  };

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="پاسخ به این نظر..."
        className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm focus:border-emerald focus:outline-none"
      />
      <Button
        onClick={submit}
        disabled={!text.trim()}
        className="shrink-0 gap-1.5 bg-emerald text-white sm:h-10"
      >
        <Send className="h-4 w-4" />
        ارسال پاسخ
      </Button>
    </div>
  );
}
