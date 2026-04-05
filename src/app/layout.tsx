import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { I18nProvider } from "@/i18n/context";
import { PageViewTracker } from "@/components/page-view-tracker";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1117" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "GameTan — Test Your Esports Talent",
    template: "%s | GameTan",
  },
  description:
    "3 mini-games measure your reaction speed, pattern recognition, and decision-making against pro player benchmarks. Discover your esports talent tier.",
  keywords: [
    "esports talent test",
    "pro player benchmark",
    "gaming talent detection",
    "reaction speed test",
    "gaming talent test",
    "game recommendation",
    "gamer archetype",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GameTan",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "GameTan",
    title: "GameTan — Test Your Esports Talent",
    description:
      "3 mini-games measure your gaming talent against pro player benchmarks. Discover your esports talent tier.",
    locale: "zh_CN",
    alternateLocale: "en_US",
    images: [
      {
        url: "/api/home-card",
        width: 1200,
        height: 630,
        alt: "GameTan — Esports Talent Detection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GameTan — Test Your Esports Talent",
    description:
      "3 mini-games measure your gaming talent against pro player benchmarks.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* Inline script: dark mode detection + block context menu before React hydrates */
const APP_INIT_SCRIPT = `
  (function() {
    var stored = localStorage.getItem('app-theme');
    var cls = 'dark';
    if (stored === 'light') cls = '';
    if (cls) document.documentElement.classList.add(cls);
    else document.documentElement.classList.remove('dark');
  })();
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  document.addEventListener('selectstart', function(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    e.preventDefault();
  });
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Sync <html lang> with stored locale before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem("app-locale");if(l==="zh")document.documentElement.lang="zh-CN";else if(!l){var n=navigator.language||"";if(n.startsWith("zh"))document.documentElement.lang="zh-CN"}}catch(e){}`,
          }}
        />
        {/* JSON-LD Structured Data — Organization + WebSite + Quiz */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "GameTan",
                url: "https://gametan.ai",
                logo: "https://gametan.ai/icons/icon-512.png",
                description: "Esports talent detection — 3 mini-games measure your reaction speed, pattern recognition, and decision-making against pro player benchmarks.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "GameTan",
                url: "https://gametan.ai",
                description: "Test your esports talent against pro player benchmarks",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://gametan.ai/archetype?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Quiz",
                name: "Esports Talent Test",
                url: "https://gametan.ai/quiz",
                description: "3 mini-games measuring reaction speed, pattern recognition, and risk decision-making. Compare your scores against pro player benchmarks.",
                about: { "@type": "Thing", name: "Esports Talent" },
                educationalLevel: "beginner",
                timeRequired: "PT3M",
                inLanguage: ["en", "zh"],
              },
            ]),
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={`${dmSans.variable} ${geistMono.variable} ${outfit.variable} antialiased overscroll-none`}
        style={{
          fontFamily:
            'var(--font-dm-sans), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
        }}
      >
        <script dangerouslySetInnerHTML={{ __html: APP_INIT_SCRIPT }} />
        <I18nProvider>{children}</I18nProvider>
        <PageViewTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
