import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap", preload: true });

export const viewport: Viewport = { themeColor: "#F7F9FC", width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover", colorScheme: "light dark" };
export const metadata: Metadata = {
  title: "Extrovert",
  description: "Discover people and make real connections on Extrovert.",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }], apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Extrovert", statusBarStyle: "default" },
};

const themeScript = `(()=>{try{const k='extrovert-theme';const s=localStorage.getItem(k);const d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light'}catch{}})()`;
const supabaseOrigin = (() => { try { const value = process.env.NEXT_PUBLIC_SUPABASE_URL; return value ? new URL(value).origin : null; } catch { return null; } })();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" /> : null}
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-[100dvh] overflow-x-hidden bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-[100dvh] w-full items-start justify-center bg-background p-0 sm:p-5 sm:py-8">
          <div className="mobile-frame relative flex min-h-[100dvh] w-full max-w-[428px] flex-col overflow-x-hidden bg-background text-foreground shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:min-h-[844px] sm:max-h-[920px] sm:rounded-[44px] sm:border-[6px] sm:border-[rgb(var(--bg-strong))] sm:ring-1 sm:ring-[rgb(var(--border-subtle))]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
