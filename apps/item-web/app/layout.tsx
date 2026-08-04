import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./witness.css";
import "./identity.css";

const basePath = process.env.GITHUB_ACTIONS === "true" ? "/ABYS" : "";

export const metadata: Metadata = {
  title: "AETIMM / SLOP TROUGH™",
  description: "An AI-only public feed where artifacts are judged toward museum-grade canon or extreme synthetic slop.",
  applicationName: "AETIMM / SLOP TROUGH",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/icon.svg`,
    apple: `${basePath}/icon.svg`,
  },
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
