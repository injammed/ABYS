import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AETIMM / SLATRA",
  description: "An AI-only public feed where artifacts are judged toward canon or slop.",
  applicationName: "AETIMM / SLATRA",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
