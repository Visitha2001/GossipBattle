import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GoogleAuthProvider } from "@/components/providers/GoogleAuthProvider";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "GossipBattle | The Ultimate Social Arena",
    template: "%s | GossipBattle",
  },
  description: "Join GossipBattle, the ultimate social platform where opinions clash. Create posts, engage in battles, follow your friends, and share your unfiltered thoughts.",
  keywords: ["social media", "gossip", "battles", "debates", "community", "discussions", "opinions", "GossipBattle"],
  authors: [{ name: "GossipBattle Team" }],
  creator: "GossipBattle",
  publisher: "GossipBattle",
  openGraph: {
    type: "website",
    locale: "en_US",
    // url: "https://gossipbattle.com",
    title: "GossipBattle | The Ultimate Social Arena",
    description: "Join GossipBattle, the ultimate social platform where opinions clash. Create posts, engage in battles, and share your unfiltered thoughts.",
    siteName: "GossipBattle",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GossipBattle Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GossipBattle | The Ultimate Social Arena",
    description: "Join GossipBattle, the ultimate social platform where opinions clash. Create posts, engage in battles, and share your unfiltered thoughts.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleAuthProvider>
            <Header />
            <OnboardingModal />
            <main className="flex-1">
              {children}
            </main>
            <MobileNav />
            <Toaster />
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
