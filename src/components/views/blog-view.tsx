"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, TrendingUp } from "lucide-react";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { useGo } from "@/lib/use-go";
import { toFa, toPersianShortDate } from "@/lib/format";
import { blogPosts } from "@/mocks/blog-posts";
import { SmartImage } from "@/components/common/smart-image";

export function BlogView() {
  const go = useGo();

  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

  return (
    <div className="bg-background pt-28">
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <ScrollReveal className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              مجله سفر
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              راهنمای <span className="text-gradient-emerald">سفر</span> در ایران
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              مقالات، راهنماها و داستان‌های سفر از سراسر ایران.
            </p>
          </ScrollReveal>

          {/* Featured post */}
          <ScrollReveal delay={0.1}>
            <article
              onClick={() => go("blog-detail", { id: String(featured.id) })}
              className="group mb-12 grid cursor-pointer gap-6 overflow-hidden rounded-[2rem] border bg-card shadow-sm transition hover:shadow-xl md:grid-cols-2"
            >
              <div className="relative h-72 overflow-hidden md:h-full md:min-h-[420px]">
                <SmartImage
                  src={featured.image}
                  alt={featured.title}
                  fallback="tour"
                  aspectClass="size-full"
                  fallbackLabel={featured.category}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent md:bg-gradient-to-l" />
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-forest backdrop-blur">
                    <TrendingUp className="h-3 w-3" />
                    منتخب سردبیر
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center p-6 md:p-10">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground max-sm:gap-x-2 max-sm:gap-y-1">
                  <span className="rounded-full bg-emerald/10 px-2.5 py-1 font-bold text-emerald">
                    {featured.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {toFa(featured.readTime)} دقیقه
                  </span>
                  <span>•</span>
                  <span>{toPersianShortDate(featured.date)}</span>
                </div>
                <h2 className="text-2xl font-extrabold leading-tight transition group-hover:text-primary md:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-4 text-muted-foreground md:text-lg">
                  {featured.excerpt}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <SmartImage
                    src={featured.author.avatar}
                    alt={featured.author.name}
                    fallback="avatar"
                    shimmer={false}
                    aspectClass="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold">
                      {featured.author.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {featured.author.role}
                    </p>
                  </div>
                </div>
                <span className="mt-6 flex items-center gap-1 text-sm font-bold text-primary">
                  ادامه مطلب
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </span>
              </div>
            </article>
          </ScrollReveal>

          {/* Rest grid */}
          <StaggerGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <motion.article
                key={p.id}
                variants={staggerItem}
                onClick={() => go("blog-detail", { id: String(p.id) })}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-xl"
              >
                <div className="relative h-52 overflow-hidden">
                  <SmartImage
                    src={p.image}
                    alt={p.title}
                    fallback="tour"
                    aspectClass="size-full"
                    fallbackLabel={p.category}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-xs font-bold text-forest backdrop-blur">
                    {p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {toFa(p.readTime)} دقیقه مطالعه
                  </div>
                  <h3 className="line-clamp-2 text-lg font-bold leading-7 transition group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {p.excerpt}
                  </p>
                  <button className="mt-auto flex items-center gap-1 pt-4 text-sm font-bold text-primary">
                    ادامه مطلب
                    <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                  </button>
                </div>
              </motion.article>
            ))}
          </StaggerGroup>
        </div>
      </section>
    </div>
  );
}
