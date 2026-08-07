import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GoogleAuthProvider } from "@/components/providers/GoogleAuthProvider";
import { Header } from "@/components/Header";
import { OnboardingModal } from "@/components/OnboardingModal";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GossipBattle",
  description: "The Ultimate GossipBattle Arena",
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
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
