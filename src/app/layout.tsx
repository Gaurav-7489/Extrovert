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
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Extrovert",
  description: "Discover people and make real connections on Extrovert.",
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
};

const darkThemeScript = `(()=>{try{document.documentElement.classList.add('dark');localStorage.removeItem('extrovert-theme')}catch{}})()`;
const discoverSingleCardStyle = `.mobile-frame main > .relative.min-h-0.w-full.flex-1 > article:nth-child(n+2){display:none!important}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkThemeScript }} />
        <style dangerouslySetInnerHTML={{ __html: discoverSingleCardStyle }} />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-[100dvh] overflow-x-hidden bg-background font-sans text-foreground antialiased selection:bg-[#550000] selection:text-white">
        <div className="flex min-h-[100dvh] w-full items-start justify-center bg-background p-0 sm:p-5 sm:py-8">
          <div className="mobile-frame relative flex min-h-[100dvh] w-full max-w-[428px] flex-col overflow-x-hidden bg-background text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.85)] sm:min-h-[844px] sm:max-h-[920px] sm:rounded-[44px] sm:border-[6px] sm:border-[#1e1e26] sm:ring-1 sm:ring-white/5">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
