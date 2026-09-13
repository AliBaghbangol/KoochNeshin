export interface Testimonial {
  id: string;
  author: string;
  avatar: string;
  role: string;
  text: string;
  rating: number;
  tour: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "tm1",
    author: "سحر تقوی",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "مسافر دماوند",
    text: "صعود به دماوند با تیم کوچ‌نشین یکی از بهترین تجربه‌های زندگی‌ام بود. لیدر تور فوق‌العاده بود و همه‌چیز دقیقاً طبق برنامه پیش رفت.",
    rating: 5,
    tour: "صعود فصلی قله دماوند",
  },
  {
    id: "tm2",
    author: "کیان مرادی",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "علاقه‌مند به کویر",
    text: "کویر لوت در شب ستاره‌بینی تجربه‌ای فراموش‌نشدنی بود. تلسکوپ و توضیحات لیدر شگفت‌انگیز بود.",
    rating: 5,
    tour: "کویر لوت — ستارگان و کرت‌ها",
  },
  {
    id: "tm3",
    author: "الناز شریفی",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "عکاس طبیعت",
    text: "تور عکاسی جنگل ابر دقیقاً چیزی بود که نیاز داشتم. کارگاه عکاسی فوق‌العاده بود.",
    rating: 5,
    tour: "جنگل ابر عکاسی",
  },
  {
    id: "tm4",
    author: "آرمان یوسفی",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "تاریخ‌دوست",
    text: "با راهنمایی کارشناس باستان‌شناسی، تخت جمشید را واقعاً فهمیدم. نه فقط دیدیم، بلکه یاد گرفتیم.",
    rating: 5,
    tour: "تخت جمشید و نقش رستم",
  },
  {
    id: "tm5",
    author: "رویا احمدی",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "مسافر قشم",
    text: "دره ستارگان و جنگل حرا را با بهترین لیدر تجربه کردم. حتماً دوباره با کوچ‌نشین سفر می‌کنم.",
    rating: 4,
    tour: "قشم — دره ستارگان",
  },
  {
    id: "tm6",
    author: "مهدی کریمی",
    avatar:
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "کوهنورد آماتور",
    text: "اجاره تجهیزات از کوچ‌نشین خیلی راحت بود. کیفیت عالی و قیمت منصفانه. کمپ کمپ به کمپ!",
    rating: 5,
    tour: "اجاره تجهیزات",
  },
  {
    id: "tm7",
    author: "دلارا حسینی",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "طبیعت‌گرد",
    text: "قابلیت مقایسه تورهای مشابه عالی بود. توانستم بهترین گزینه را با بهترین قیمت پیدا کنم.",
    rating: 5,
    tour: "مرنجاب",
  },
  {
    id: "tm8",
    author: "سامان طاهری",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&q=80",
    role: "مسافر ماسوله",
    text: "جاده جنگلی فومن و ماسوله بی‌نظیر بود. بوم‌گردی فوق‌العاده و غذای محلی خوشمزه.",
    rating: 4,
    tour: "ماسوله و جاده فومن",
  },
];

export const provinces = [
  { id: "mazandaran", name: "مازندران", toursCount: 8 },
  { id: "gilan", name: "گیلان", toursCount: 4 },
  { id: "semnan", name: "سمنان", toursCount: 4 },
  { id: "kerman", name: "کرمان", toursCount: 6 },
  { id: "fars", name: "فارس", toursCount: 5 },
  { id: "hormozgan", name: "هرمزگان", toursCount: 7 },
  { id: "isfahan", name: "اصفهان", toursCount: 6 },
  { id: "azarbaijan-sharghi", name: "آذربایجان شرقی", toursCount: 5 },
];
