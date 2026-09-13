# سرویس اعلان‌های زنده کوچ‌نشین (notification-service)

سرویس مستقل Socket.IO روی پورت **3003** — اعلان‌های زنده فارسی (تخفیف لحظه‌ای، ظرفیت تور، مسافر جدید، نظرات و…) را به‌صورت دوره‌ای برای همه کلاینت‌های متصل پخش می‌کند و دکمه «شبیه‌سازی اعلان زنده» در مرکز اعلان‌ها را پشتیبانی می‌کند.

## اجرا

```bash
cd mini-services/notification-service
bun install
bun run dev
```

یا با npm/Node:

```bash
npm install
npx tsx index.ts   # یا: bun index.ts
```

- پورت: `3003`
- لاگ زنده در `service.log` (در حالت `bun --hot` در ترمینال هم چاپ می‌شود)

## اتصال فرانت‌اند (خودکار)

فرانت‌اند مقصد اتصال را **به‌صورت خودکار** تشخیص می‌دهد (`src/components/layout/notification-realtime.tsx`):

| محیط | مقصد اتصال |
|---|---|
| اجرای لوکال (`localhost` / `127.0.0.1`) | `http://localhost:3003` (مستقیم) |
| سندباکس/پیش‌نمایش (gateway کدی) | `/?XTransformPort=3003` (از طریق gateway) |

## بدون این سرویس چه می‌شود؟

هیچ چیزی نمی‌شکند — اپ به‌صورت graceful degrade عمل می‌کند:
- چیپ وضعیت «زنده» جای خود را به «آفلاین» می‌دهد (بدون کرش، بدون لاگ پرِ خطا)
- همه امکانات دیگر (تورها، رزرو، پرداخت، داشبورد،…) کاملاً کار می‌کنند
- دکمه «شبیه‌سازی اعلان زنده» پیام «اتصال زنده برقرار نیست» نشان می‌دهد

## رویدادها (Socket API)

| رویداد | جهت | توضیح |
|---|---|---|
| `notification:new` | سرور → کلاینت | اعلان زنده (type/title/body/actionLabel/actionView/id) |
| `platform:stats` | سرور → کلاینت | تعداد آنلاین‌ها `{ online }` |
| `notifications:hello` | سرور → کلاینت | سلام اولیه `{ serverTime, online }` |
| `notifications:simulate` | کلاینت → سرور | پخش فوری یک رویداد نمونه |
| `notifications:ping` | کلاینت → سرور | تست سلامت (ack: `notifications:pong`) |
