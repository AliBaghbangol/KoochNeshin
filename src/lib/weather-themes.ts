import { Sun, Cloud, CloudRain, CloudSnow, CloudSun } from "lucide-react";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "snowy" | "partly-cloudy";

export interface WeatherTheme {
  icon: typeof Sun;
  label: string;
  /** hero sky gradient — dark mode (richer) */
  heroDark: string;
  /** hero sky gradient — light mode */
  hero: string;
  /** icon tiles (header + forecast rows) in the same family */
  tile: string;
  /** label chips in the same family */
  chip: string;
  /** micro accent (header underline) */
  accentBar: string;
  particle: "sun" | "rain" | "snow" | "cloud";
}

/**
 * Per-condition SINGLE-SPECTRUM theme (user request: «از طیف مناسب همون هوا
 * استفاده کن» — no more rainbow). Every colored element of the widget (hero
 * sky, icon tiles, chips, warmth bars, header accent) comes from ONE hue
 * family chosen by the destination's current weather.
 *
 * Shared by the tour-description WeatherWidget (tours/weather-widget.tsx)
 * and the Live Trip weather forecast (live-trip/weather-forecast.tsx) so
 * both surfaces wear the exact same visual family.
 */
export const WEATHER_THEMES: Record<WeatherCondition, WeatherTheme> = {
  sunny: {
    icon: Sun,
    label: "آفتابی",
    heroDark: "from-amber-500/90 via-amber-500/70 to-orange-400/50",
    hero: "from-amber-300 via-amber-200 to-orange-200",
    tile: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    chip: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    accentBar: "bg-amber-400",
    particle: "sun",
  },
  "partly-cloudy": {
    icon: CloudSun,
    label: "نیمه‌ابری",
    heroDark: "from-sky-600/90 via-sky-500/70 to-cyan-400/50",
    hero: "from-sky-300 via-sky-200 to-cyan-100",
    tile: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
    chip: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    accentBar: "bg-sky-400",
    particle: "cloud",
  },
  cloudy: {
    icon: Cloud,
    label: "ابری",
    heroDark: "from-slate-600/90 via-slate-500/70 to-slate-400/50",
    hero: "from-slate-300 via-slate-200 to-zinc-200",
    tile: "bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
    chip: "bg-slate-500/10 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
    accentBar: "bg-slate-400",
    particle: "cloud",
  },
  rainy: {
    icon: CloudRain,
    label: "بارانی",
    heroDark: "from-blue-700/90 via-blue-600/70 to-blue-400/50",
    hero: "from-blue-400 via-blue-300 to-indigo-200",
    tile: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
    chip: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    accentBar: "bg-blue-500",
    particle: "rain",
  },
  snowy: {
    icon: CloudSnow,
    label: "برفی",
    heroDark: "from-cyan-600/90 via-cyan-500/70 to-sky-400/50",
    hero: "from-cyan-300 via-cyan-100 to-sky-100",
    tile: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300",
    chip: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
    accentBar: "bg-cyan-400",
    particle: "snow",
  },
};
