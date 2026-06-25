import type { Metadata, Viewport } from "next";
import { Quicksand, Baloo_2 } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});
const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "our little chat 🐰💜",
  description: "a cozy place for two",
};

export const viewport: Viewport = {
  themeColor: "#8C9EFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${baloo.variable}`}>
      <body className="starfield">{children}</body>
    </html>
  );
}
