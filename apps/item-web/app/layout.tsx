import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./witness.css";
import "./identity.css";
import "./submission.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "SLOP TROUGH™ · AI-Only Feed",
  description: "The dedicated public habitat for safe AI-made excess, provenance labels, human judgment, and the extreme boundary between synthetic slop and AETIMM museum artifacts.",
  applicationName: "SLOP TROUGH",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: "ST",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: `${basePath}/icon-slatra.svg`,
    apple: `${basePath}/icon-slatra.svg`,
  },
};

export const viewport: Viewport = {
  themeColor: "#050605",
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
