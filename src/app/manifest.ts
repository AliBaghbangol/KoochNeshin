import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "کوچ‌نشین | پلتفرم تور و تجهیزات گردشگری ایران",
    short_name: "کوچ‌نشین",
    description:
      "سفرهای تجربی به زیباترین نقاط ایران؛ تورهای رقابتی از بهترین لیدرها، اجاره و فروش تجهیزات کوهنوردی و کمپینگ.",
    id: "/",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "fa",
    background_color: "#f7f3ec",
    theme_color: "#0f6b4a",
    categories: ["travel", "shopping", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "تورها",
        short_name: "تورها",
        url: "/tours",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "مقاصد",
        short_name: "مقاصد",
        url: "/destinations",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "تجهیزات",
        short_name: "تجهیزات",
        url: "/equipment",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
