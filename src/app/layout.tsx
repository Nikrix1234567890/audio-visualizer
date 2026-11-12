import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { NavBar } from "@/components/NavBar";
import { MotionProvider, OutsideEditor } from "@/components/SiteChrome";
import { BRAND } from "../../remotion/brand";

// Headlines, the interface, and every number (see globals.css for where
// the three are used).
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const sans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg-1 text-ink-1">
        <AuthProvider>
          <MotionProvider>
            {/* The editor fills the window and brings its own top bar. */}
            <OutsideEditor>
              <NavBar />
            </OutsideEditor>
            <div className="flex flex-1 flex-col">{children}</div>
          </MotionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
