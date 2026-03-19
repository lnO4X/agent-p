import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/i18n/context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "GameTan — Discover Your Gaming DNA",
    template: "%s | GameTan",
  },
  description:
    "Play 13 mini-games to uncover your unique gaming talents. Get AI-powered recommendations from 100+ games across all platforms.",
  keywords: [
    "gaming talent test",
    "game recommendation",
    "gaming personality",
    "游戏天赋测试",
    "游戏推荐",
    "游戏百宝箱",
    "AI game advisor",
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
    title: "GameTan — Discover Your Gaming DNA",
    description:
      "Play 13 mini-games to uncover your unique gaming talents. AI-powered recommendations from 100+ games.",
    locale: "zh_CN",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameTan — Discover Your Gaming DNA",
    description:
      "Play 13 mini-games to uncover your unique gaming talents.",
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
    else if (stored === 'dark') cls = 'dark';
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) cls = '';
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none`}
        style={{
          fontFamily:
            'var(--font-geist-sans), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
        }}
      >
        <script dangerouslySetInnerHTML={{ __html: APP_INIT_SCRIPT }} />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
