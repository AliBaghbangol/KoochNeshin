import { createServer } from 'http'
import { Server } from 'socket.io'

/**
 * KochNeshin — Real-time Notification Service (mini-service, port 3004)
 * (moved off 3003 — that port now belongs to trip-sync-service)
 *
 * Broadcasts simulated "live platform events" to every connected client as
 * `notification:new` payloads shaped exactly like the frontend
 * AppNotification (sans read/time, which the client fills in).
 *
 * Events:
 *   - connection          → `notifications:hello` { serverTime, online }
 *   - (interval 35–75s)   → broadcast `notification:new` (random live event)
 *   - connect/disconnect  → broadcast `platform:stats` { online }
 *   - `notifications:simulate` (client → server) → broadcast one event now
 *     (used by the «شبیه‌سازی اعلان زنده» button in the notification center)
 *   - `notifications:ping` (client) → ack `notifications:pong` (health check)
 */

const httpServer = createServer()

const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

const PORT = 3004

type NotificationType = 'booking' | 'discount' | 'review' | 'system' | 'social'

interface NotificationPayload {
  id: string
  type: NotificationType
  title: string
  body: string
  actionLabel?: string
  actionView?: string
}

/** Pool of Persian live-event templates (rotate + randomize). */
const EVENT_TEMPLATES: Omit<NotificationPayload, 'id'>[] = [
  {
    type: 'discount',
    title: '⚡ کاهش قیمت لحظه‌ای!',
    body: 'قیمت تور «کویر لوت — سه‌روزه» ۱۵٪ کاهش یافت. فرصت محدود است!',
    actionLabel: 'مشاهده تور',
    actionView: 'tours',
  },
  {
    type: 'booking',
    title: 'ظرفیت تور در حال پر شدن است',
    body: 'فقط ۲ صندلی برای تور «جنگل ابر — شب مه‌آلود» باقی مانده است.',
    actionLabel: 'رزرو فوری',
    actionView: 'tours',
  },
  {
    type: 'social',
    title: 'مسافر جدیدی به تور شما پیوست',
    body: 'سارا م. به تور «کندوان — روستای تاریخی» اضافه شد.',
    actionLabel: 'مشاهده تور',
    actionView: 'tour-detail',
  },
  {
    type: 'review',
    title: 'نظر جدید برای تور موردعلاقه‌تان',
    body: 'امتیاز ۵ ستاره برای «صعود فصلی قله دماوند» ثبت شد.',
    actionLabel: 'خواندن نظرها',
    actionView: 'tour-detail',
  },
  {
    type: 'discount',
    title: '🔥 پیشنهاد شگفت‌انگیز تجهیزات',
    body: 'اجاره چادر کمپینگ دو نفره این هفته ۲۰٪ تخفیف دارد.',
    actionLabel: 'مشاهده تجهیزات',
    actionView: 'equipment',
  },
  {
    type: 'system',
    title: 'هشدار آب‌وهوایی',
    body: 'بارش باران شدید در ارتفاعات سبلان پیش‌بینی می‌شود — تجهیزات ضدآب فراموش نشود.',
    actionLabel: 'جزئیات',
  },
  {
    type: 'booking',
    title: 'رزرو شما تأیید شد',
    body: 'رزرو تجهیزات شما با موفقیت تأیید و برای ارسال آماده‌سازی می‌شود.',
    actionLabel: 'مشاهده سفارش‌ها',
    actionView: 'user-dashboard',
  },
  {
    type: 'system',
    title: 'مقاله جدید در بلاگ',
    body: '«راهنمای کامل چیدمان کوله‌پشتی کوهنوردی» منتشر شد.',
    actionLabel: 'خواندن مقاله',
    actionView: 'blog',
  },
  {
    type: 'social',
    title: 'گروه سفر شما فعال شد',
    body: '۳ مسافر جدید به گروه سفر «دماوند» شما پیوستند و در حال گفتگو هستند.',
    actionLabel: 'مشاهده',
    actionView: 'user-dashboard',
  },
  {
    type: 'system',
    title: 'به‌روزرسانی پلتفرم',
    body: 'تقویم جلالی داشبورد و رسید چاپی جدید اضافه شد — همین حالا امتحان کنید!',
    actionLabel: 'رفتن به داشبورد',
    actionView: 'user-dashboard',
  },
]

let onlineUsers = 0
let templateIndex = Math.floor(Math.random() * EVENT_TEMPLATES.length)
let broadcastTimer: ReturnType<typeof setTimeout> | null = null

function buildPayload(): NotificationPayload {
  const tpl = EVENT_TEMPLATES[templateIndex % EVENT_TEMPLATES.length]
  templateIndex += 1
  return {
    ...tpl,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }
}

function broadcastRandomEvent() {
  const payload = buildPayload()
  io.emit('notification:new', payload)
  scheduleNextBroadcast()
}

function scheduleNextBroadcast() {
  if (broadcastTimer) clearTimeout(broadcastTimer)
  // Randomized 35–75s so live pushes feel organic, not metronomic.
  const delay = 35_000 + Math.floor(Math.random() * 40_000)
  broadcastTimer = setTimeout(broadcastRandomEvent, delay)
}

function broadcastStats() {
  io.emit('platform:stats', { online: onlineUsers })
}

io.on('connection', (socket) => {
  onlineUsers += 1
  console.log(`[notification-service] client connected: ${socket.id} (online: ${onlineUsers})`)

  socket.emit('notifications:hello', {
    serverTime: new Date().toISOString(),
    online: onlineUsers,
  })
  broadcastStats()

  socket.on('notifications:simulate', () => {
    const payload = buildPayload()
    io.emit('notification:new', payload)
    console.log(`[notification-service] simulated event → ${payload.type}: ${payload.title}`)
  })

  socket.on('notifications:ping', (ack?: (data: unknown) => void) => {
    if (typeof ack === 'function') ack({ pong: true, time: new Date().toISOString() })
  })

  socket.on('disconnect', () => {
    onlineUsers = Math.max(0, onlineUsers - 1)
    broadcastStats()
    console.log(`[notification-service] client disconnected (online: ${onlineUsers})`)
  })

  socket.on('error', (error) => {
    console.error(`[notification-service] socket error (${socket.id}):`, error)
  })
})

// Start the organic broadcast loop only once at least one client is likely
// listening; an immediate first tick on boot is harmless but noisy in logs.
scheduleNextBroadcast()

httpServer.listen(PORT, () => {
  console.log(`[notification-service] WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[notification-service] SIGTERM — shutting down…')
  if (broadcastTimer) clearTimeout(broadcastTimer)
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[notification-service] SIGINT — shutting down…')
  if (broadcastTimer) clearTimeout(broadcastTimer)
  httpServer.close(() => process.exit(0))
})
