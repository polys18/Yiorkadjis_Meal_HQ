import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Meal HQ",
  description: "Family meal voting",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Meal HQ", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#C77D49",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
