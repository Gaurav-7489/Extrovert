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
  themeColor: "#07080b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  applicationName: "Extrovert",
  title: {
    default: "Extrovert — Find your people",
    template: "%s · Extrovert",
  },
  description: "Discover people, make plans, match, and turn nearby moments into real connections.",
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
    title: "Extrovert",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, address: false, email: false },
};

const darkThemeScript =
  "(()=>{try{document.documentElement.classList.add('dark');localStorage.removeItem('extrovert-theme')}catch{}})()";

const supabaseOrigin = (() => {
  try {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
})();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={"dark " + inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkThemeScript }} />
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-[100dvh] overflow-x-hidden bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-[100dvh] w-full items-start justify-center bg-[#050608] p-0 sm:p-5 sm:py-8">
          <div className="mobile-frame relative flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-x-hidden bg-background text-foreground sm:rounded-[46px] sm:border-[5px] sm:border-[#1d2028] sm:shadow-[0_30px_90px_rgba(0,0,0,.72)] sm:ring-1 sm:ring-white/5">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
