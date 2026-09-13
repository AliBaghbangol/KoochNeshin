import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteLoader } from "@/components/common/route-loader";
import { QueryProvider } from "@/components/providers/query-provider";
import { RTLDirectionProvider } from "@/components/providers/rtl-direction-provider";

export const metadata: Metadata = {
  title: "کوچ‌نشین | پلتفرم تور و تجهیزات گردشگری ایران",
  description:
    "سفرهای تجربی به زیباترین نقاط ایران؛ تورهای رقابتی از بهترین لیدرها، اجاره و فروش تجهیزات کوهنوردی و کمپینگ.",
  keywords: [
    "تور ایران",
    "گردشگری",
    "دماوند",
    "کوهنوردی",
    "اجاره تجهیزات کمپینگ",
    "لیدر تور",
  ],
  authors: [{ name: "کوچ‌نشین" }],
  metadataBase: new URL("http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  applicationName: "کوچ‌نشین",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "کوچ‌نشین",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "کوچ‌نشین | پلتفرم تور و تجهیزات گردشگری ایران",
    description:
      "سفرهای تجربی به زیباترین نقاط ایران؛ تورهای رقابتی از بهترین لیدرها، اجاره و فروش تجهیزات کوهنوردی و کمپینگ.",
    type: "website",
    locale: "fa_IR",
    siteName: "کوچ‌نشین",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "کوچ‌نشین" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f6b4a" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f1a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Vazirmatn font — loaded at runtime via CDN, not at build time.
            This avoids build failures in sandboxed environments without
            internet access to fonts.googleapis.com. */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RTLDirectionProvider>
          <QueryProvider>
          <TooltipProvider delayDuration={200} skipDelayDuration={300}>
            {children}
          </TooltipProvider>
          <Toaster />
          <SonnerToaster position="top-center" dir="rtl" />
          {/* Root-layout resident: survives client-side navigations so it can
              actually observe pathname CHANGES (AppShell remounts per page). */}
          <RouteLoader />
          </QueryProvider>
          </RTLDirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
