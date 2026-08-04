import type { Metadata, Viewport } from "next";

const basePath = process.env.GITHUB_ACTIONS === "true" ? "/ABYS" : "";

export const metadata: Metadata = {
  title: "SLOP TROUGH™ · ST",
  description: "The extreme synthetic-waste feed, labeled ST.",
  applicationName: "SLOP TROUGH",
  manifest: `${basePath}/manifest-slop-trough.webmanifest`,
  icons: {
    icon: `${basePath}/icon-slatra.svg`,
    apple: `${basePath}/icon-slatra.svg`,
  },
};

export const viewport: Viewport = {
  themeColor: "#050605",
  colorScheme: "dark",
};

export default function SlopTroughLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
