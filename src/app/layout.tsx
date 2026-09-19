import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MobileViewportStabilizer } from "@/components/layout/mobile-viewport-stabilizer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#030304",
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
      <body className="min-h-[var(--app-height,100dvh)] overflow-x-hidden bg-background font-sans text-foreground antialiased">
        <div className="app-stage flex min-h-[var(--app-height,100dvh)] w-full items-start justify-center bg-[#030304] p-0">
          <div className="mobile-frame relative flex min-h-[var(--app-height,100dvh)] w-full flex-col overflow-x-hidden bg-background text-foreground">
            <MobileViewportStabilizer />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
