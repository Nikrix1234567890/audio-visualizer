import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

const LINKS = [
  { href: "/editor", label: "Editor" },
  { href: "/pricing", label: "Pricing" },
  { href: "/legal/imprint", label: "Imprint" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
];

/** The footer of the public pages (not the editor, which fills the screen). */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-muted">
        <Wordmark />
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
