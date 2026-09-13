"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  ArrowLeft,
  ChevronLeft,
  Heart,
  Share2,
  Bookmark,
  Printer,
  Twitter,
  Send,
  Sparkles,
  Lightbulb,
  Quote,
} from "lucide-react";
import { useGo } from "@/lib/use-go";
import { useViewParams } from "@/lib/use-view-params";
import { getBlogPost, getRelatedPosts, type BlogBlock } from "@/mocks/blog-posts";
import {
  toFa,
  toPersianDate,
  toPersianShortDate,
} from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { ShareDialog } from "@/components/common/share-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Reading progress bar — writes the width directly to the DOM node inside a
// rAF-batched passive listener, so scrolling never triggers React re-renders.
// Remounted per article (key = post id in the caller) so switching posts
// re-syncs the bar from the very top.
function ReadingProgress() {
  const barRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let raf = 0;
    const timers: number[] = [];
    const update = () => {
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
      if (barRef.current) barRef.current.style.width = `${progress}%`;
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    // Initial sync is NOT enough: the page height keeps changing for the
    // first second (hero/content images load, ScrollReveal mounts) and the
    // browser may still be settling the scroll position left over from the
    // previous view — that used to leave the bar wrong until the user
    // scrolled once (user report). Re-check during the first second.
    update();
    timers.push(window.setTimeout(update, 100));
    timers.push(window.setTimeout(update, 400));
    timers.push(window.setTimeout(update, 1000));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
      <motion.div
        ref={barRef}
        className="h-full bg-gradient-to-l from-emerald via-gold to-sunset"
        style={{ width: "0%" }}
      />
    </div>
  );
}

// Auto-generate table of contents from headings
function useTableOfContents(blocks: BlogBlock[]) {
  return React.useMemo(() => {
    return blocks
      .map((b, i) => (b.type === "heading" ? { id: i, text: b.text } : null))
      .filter(Boolean) as { id: number; text: string }[];
  }, [blocks]);
}

function ContentBlock({ block, idx }: { block: BlogBlock; idx: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  if (block.type === "paragraph") {
    return (
      <ScrollReveal delay={0.05 * idx}>
        <p ref={ref} className="mb-5 text-lg leading-9 text-foreground/85">
          {block.text}
        </p>
      </ScrollReveal>
    );
  }
  if (block.type === "heading") {
    return (
      <ScrollReveal delay={0.05 * idx}>
        <h2
          id={`heading-${idx}`}
          className="mb-4 mt-10 flex scroll-mt-28 items-center gap-2 text-2xl font-extrabold leading-tight md:text-3xl"
        >
          <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-emerald to-gold" />
          {block.text}
        </h2>
      </ScrollReveal>
    );
  }
  if (block.type === "quote") {
    return (
      <ScrollReveal delay={0.05 * idx}>
        <blockquote className="my-8 rounded-3xl border-r-4 border-gold bg-gradient-to-l from-gold/5 to-transparent p-6">
          <Quote className="mb-3 h-8 w-8 text-gold/40" />
          <p className="text-xl font-medium leading-8 italic text-foreground">
            {block.text}
          </p>
          {block.author && (
            <cite className="mt-3 block text-sm font-semibold text-muted-foreground">
              — {block.author}
            </cite>
          )}
        </blockquote>
      </ScrollReveal>
    );
  }
  if (block.type === "list") {
    return (
      <ScrollReveal delay={0.05 * idx}>
        <ul className="my-5 space-y-3">
          {block.items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 text-lg leading-8 text-foreground/85"
            >
              <span className="mt-2.5 grid h-2 w-2 shrink-0 place-items-center rounded-full bg-emerald" />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </ScrollReveal>
    );
  }
  if (block.type === "image") {
    return (
      <ScrollReveal delay={0.05 * idx}>
        <figure className="my-8">
          <div className="overflow-hidden rounded-3xl">
            <SmartImage
              src={block.src}
              alt={block.caption ?? ""}
              fallback="tour"
              aspectClass="aspect-[16/9]"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      </ScrollReveal>
    );
  }
  if (block.type === "tip") {
    return (
      <ScrollReveal delay={0.05 * idx}>
        <div className="my-6 overflow-hidden rounded-3xl border-2 border-gold/30 bg-gradient-to-l from-gold/10 to-transparent p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="mb-1 font-bold text-gold">{block.title}</p>
              <p className="leading-7 text-foreground/85">{block.text}</p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    );
  }
  return null;
}

export function BlogDetailView() {
  const go = useGo();
  const params = useViewParams();
  const post = getBlogPost(Number(params.id));
  const toc = useTableOfContents(post?.content ?? []);
  // Start on the FIRST section — never on a random later one.
  const [activeHeading, setActiveHeading] = React.useState<number | null>(
    toc[0]?.id ?? null,
  );
  const [bookmarked, setBookmarked] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // An article ALWAYS opens from its very top. The browser used to keep the
  // scroll position of the previous view (or land mid-smooth-scroll), so the
  // reading-progress bar started wrong and only corrected itself after the
  // user scrolled once (user report). Force-reset immediately and re-assert
  // over the first frames — before a reader could realistically scroll.
  const postId = params.id;
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    const settle = window.setTimeout(() => window.scrollTo(0, 0), 100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [postId]);

  // Track active heading on scroll — measured with viewport-relative
  // getBoundingClientRect() instead of offsetTop: every content block is
  // wrapped in a framer-motion ScrollReveal whose translateY(30px) transform
  // makes it the offsetParent until the reveal plays, so offsetTop used to
  // be measured relative to that tiny wrapper (≈0px ≤ threshold) and the spy
  // ended on a later section by default — e.g. «بخش‌های اصلی», the 2nd TOC
  // item of the تخت جمشید article, was bold right after opening (user
  // report). Rects are immune to transformed ancestors.
  React.useEffect(() => {
    if (toc.length === 0) return;
    const MARK = 150; // px below the viewport top
    const onScroll = () => {
      let currentId = toc[0].id;
      for (const h of toc) {
        const el = document.getElementById(`heading-${h.id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= MARK) currentId = h.id;
      }
      setActiveHeading(currentId);
    };
    onScroll();
    // Layout keeps shifting for the first second (hero/content images load,
    // ScrollReveal transforms resolve) — re-sync so the highlight is correct
    // even before the user scrolls.
    const timers = [100, 400, 1000].map((t) => window.setTimeout(onScroll, t));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", onScroll);
    };
  }, [toc]);

  if (!post) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-background pt-28 text-center">
        <div>
          <p className="text-2xl font-bold">مقاله پیدا نشد</p>
          <button
            onClick={() => go("blog")}
            className="mt-4 rounded-full bg-primary px-6 py-2.5 text-primary-foreground"
          >
            بازگشت به مجله
          </button>
        </div>
      </div>
    );
  }

  const related = getRelatedPosts(post.id, 3);
  const readingTime = post.readTime;
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://kochneshin.ir/blog/${post.id}`;

  const openShareIntent = (kind: "twitter" | "telegram") => {
    const text = encodeURIComponent(post.title);
    const url = encodeURIComponent(shareUrl);
    const target =
      kind === "twitter"
        ? `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        : `https://t.me/share/url?url=${url}&text=${text}`;
    window.open(target, "_blank", "noopener");
    toast.success(
      kind === "twitter" ? "اشتراک‌گذاری در توییتر" : "اشتراک‌گذاری در تلگرام"
    );
  };

  return (
    <div className="bg-background pt-20">
      <ReadingProgress key={post.id} />

      {/* Hero */}
      <div className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <SmartImage
          src={post.image}
          alt={post.title}
          fallback="tour"
          aspectClass="size-full"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/70 to-forest/30" />
        <div className="absolute inset-0 bg-noise opacity-20" />

        <div className="relative mx-auto flex h-full max-w-4xl flex-col justify-end p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-cream"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-forest backdrop-blur">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-cream/80">
                <Clock className="h-3.5 w-3.5" />
                {toFa(readingTime)} دقیقه مطالعه
              </span>
              <span className="flex items-center gap-1 text-sm text-cream/80">
                <Calendar className="h-3.5 w-3.5" />
                {toPersianDate(post.date)}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-cream/85">
              {post.excerpt}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
          <article ref={contentRef} className="min-w-0">
            {/* Author bar */}
            <ScrollReveal>
              <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <SmartImage
                    src={post.author.avatar}
                    alt={post.author.name}
                    fallback="avatar"
                    shimmer={false}
                    aspectClass="h-11 w-11 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-bold">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.author.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <MagneticButton
                    onClick={() => {
                      setLiked(!liked);
                      toast.success(
                        liked ? "از پسندها خارج شد" : "پسندیده شد!"
                      );
                    }}
                    strength={0.2}
                    className={cn(
                      "grid h-10 w-10 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border transition",
                      liked
                        ? "border-sunset bg-sunset/10 text-sunset"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                  </MagneticButton>
                  <MagneticButton
                    onClick={() => {
                      setBookmarked(!bookmarked);
                      toast.success(
                        bookmarked ? "حذف از ذخیره‌ها" : "ذخیره شد!"
                      );
                    }}
                    strength={0.2}
                    className={cn(
                      "grid h-10 w-10 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border transition",
                      bookmarked
                        ? "border-emerald bg-emerald/10 text-emerald"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Bookmark
                      className={cn("h-4 w-4", bookmarked && "fill-current")}
                    />
                  </MagneticButton>
                  <MagneticButton
                    onClick={() => setShareOpen(true)}
                    strength={0.2}
                    aria-label="اشتراک‌گذاری مقاله"
                    className="grid h-10 w-10 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                  </MagneticButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Breadcrumb */}
            <div className="mb-8 flex items-center gap-1 text-sm text-muted-foreground">
              <button onClick={() => go("home")} className="hover:text-primary">
                خانه
              </button>
              <ChevronLeft className="h-3.5 w-3.5" />
              <button onClick={() => go("blog")} className="hover:text-primary">
                مجله
              </button>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="line-clamp-1 text-foreground">{post.category}</span>
            </div>

            {/* Content blocks */}
            <div>
              {post.content.map((block, i) => (
                <ContentBlock key={i} block={block} idx={i} />
              ))}
            </div>

            {/* Tags */}
            <div className="mt-12 flex flex-wrap gap-2 border-t pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Author CTA card */}
            <ScrollReveal className="mt-12">
              <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-emerald to-forest p-8 text-cream">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <SmartImage
                    src={post.author.avatar}
                    alt={post.author.name}
                    fallback="avatar"
                    shimmer={false}
                    aspectClass="h-16 w-16 rounded-2xl"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-cream/70">نوشته شده توسط</p>
                    <h4 className="text-xl font-bold">{post.author.name}</h4>
                    <p className="text-sm text-cream/80">{post.author.role}</p>
                  </div>
                  <MagneticButton
                    onClick={() => toast.success("پروفایل در حال توسعه است")}
                    className="items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-bold text-forest"
                  >
                    <Sparkles className="h-4 w-4" />
                    دنبال کردن
                  </MagneticButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Share row */}
            <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 max-sm:flex-col max-sm:items-start">
              <p className="text-sm font-semibold">این مقاله را به اشتراک بگذار</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openShareIntent("twitter")}
                  aria-label="اشتراک‌گذاری در توییتر"
                  className="grid h-9 w-9 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Twitter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openShareIntent("telegram")}
                  aria-label="اشتراک‌گذاری در تلگرام"
                  className="grid h-9 w-9 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  aria-label="چاپ مقاله"
                  className="grid h-9 w-9 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShareOpen(true)}
                  aria-label="گزینه‌های بیشتر اشتراک‌گذاری"
                  className="grid h-9 w-9 max-sm:h-11 max-sm:w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>

          {/* Sidebar (TOC + share) — stacks below the article on <lg instead
              of being hidden, so TOC/newsletter stay reachable on mobile */}
          <aside className="max-lg:order-last">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* TOC */}
              {toc.length > 0 && (
                <div className="rounded-3xl border bg-card p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    در این مقاله
                  </p>
                  <ul className="space-y-1">
                    {toc.map((h) => (
                      <li key={h.id}>
                        <button
                          onClick={() => {
                            document
                              .getElementById(`heading-${h.id}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className={cn(
                            "block w-full border-r-2 pr-3 py-1.5 text-right text-sm transition-all max-sm:py-2.5",
                            activeHeading === h.id
                              ? "border-primary border-r-[3px] -mr-[1px] pr-[11px] font-extrabold text-primary bg-primary/5 rounded-l-lg"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                          )}
                        >
                          {h.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reading time card */}
              <div className="rounded-3xl border bg-gradient-to-br from-emerald/5 to-gold/5 p-5 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-emerald" />
                <p className="text-2xl font-extrabold text-primary">
                  {toFa(readingTime)}
                </p>
                <p className="text-xs text-muted-foreground">دقیقه مطالعه</p>
              </div>

              {/* Newsletter mini */}
              <div className="rounded-3xl bg-forest p-5 text-cream">
                <p className="mb-2 font-bold">خبرنامه سفر</p>
                <p className="mb-4 text-xs text-cream/70">
                  مقالات جدید را زودتر از همه دریافت کن.
                </p>
                <input
                  placeholder="ایمیل شما"
                  className="mb-2 h-10 w-full rounded-xl border border-cream/15 bg-cream/5 px-3 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none max-sm:h-11"
                />
                <button
                  onClick={() => toast.success("عضو خبرنامه شدید!")}
                  className="h-10 w-full rounded-xl bg-gold font-bold text-forest max-sm:h-11"
                >
                  عضویت
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Related posts */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                بیشتر بخوانید
              </p>
              <h2 className="text-2xl font-extrabold md:text-3xl">
                مقالات مرتبط
              </h2>
            </div>
            <button
              onClick={() => go("blog")}
              className="flex items-center gap-1 text-sm font-bold text-primary"
            >
              همه مقالات
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 0.1}>
                <article
                  onClick={() => go("blog-detail", { id: String(p.id) })}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-xl"
                >
                  <div className="relative h-44 overflow-hidden">
                    <SmartImage
                      src={p.image}
                      alt={p.title}
                      fallback="tour"
                      aspectClass="size-full"
                      fallbackLabel={p.category}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-xs font-bold text-forest backdrop-blur">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="mb-2 text-xs text-muted-foreground">
                      {toPersianShortDate(p.date)}
                    </p>
                    <h3 className="line-clamp-2 font-bold leading-7 transition group-hover:text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {p.excerpt}
                    </p>
                    <button className="mt-auto flex items-center gap-1 pt-4 text-sm font-bold text-primary">
                      ادامه
                      <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
                    </button>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={post.title}
        url={shareUrl}
      />
    </div>
  );
}
