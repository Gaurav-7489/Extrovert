import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#550000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "DateBu — Dating & Social Discovery",
  description: "Discover people, make meaningful connections, and spark real conversations on DateBu.",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "DateBu",
    statusBarStyle: "black-translucent",
  },
};

const themeScript = `(()=>{try{const t=localStorage.getItem('extrovert-theme');if(t==='dark'||(t===null&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch{}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-[100dvh] overflow-x-hidden bg-[#060608] font-sans text-zinc-900 antialiased selection:bg-[#550000] selection:text-white dark:text-zinc-100">
        <div className="flex min-h-[100dvh] w-full items-start justify-center bg-[#060608] p-0 sm:p-5 sm:py-8">
          <div className="mobile-frame relative flex min-h-[100dvh] w-full max-w-[428px] flex-col overflow-x-hidden bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:min-h-[844px] sm:max-h-[920px] sm:rounded-[44px] sm:border-[6px] sm:border-zinc-200/90 sm:ring-1 sm:ring-black/10 dark:bg-[#0a0a0c] dark:shadow-[0_20px_60px_rgba(0,0,0,0.85)] dark:sm:border-[#1e1e26] dark:sm:ring-white/5">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}