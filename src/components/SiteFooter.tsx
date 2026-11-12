import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { BRAND } from "../../remotion/brand";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/editor", label: "Editor" },
      { href: "/templates", label: "Templates" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/help", label: "Help" },
      { href: "/help#shortcuts", label: "Keyboard shortcuts" },
      { href: "/help#questions", label: "Questions" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Create account" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/imprint", label: "Imprint" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
    ],
  },
];

/** The footer of the public pages (not the editor, which fills the screen). */
export function SiteFooter() {
  return (
    <footer className="border-t border-line-1">
      <div className="pf-footer lp-wrap">
        <div className="pf-stack gap-3">
          <Wordmark />
          <span className="max-w-[30ch]">{BRAND.tagline}</span>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
