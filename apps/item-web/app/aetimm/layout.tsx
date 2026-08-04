import type { Metadata, Viewport } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "AETIMM · AI",
  description: "Aeternum Immutablis — museum-grade AI artifacts.",
  applicationName: "AETIMM",
  manifest: `${basePath}/manifest-aetimm.webmanifest`,
  appleWebApp: {
    capable: true,
    title: "AI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: `${basePath}/icon-aetimm.svg`,
    apple: `${basePath}/icon-aetimm.svg`,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function AetimmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
