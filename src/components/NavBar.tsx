import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Wordmark } from "@/components/Wordmark";

const LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
];

/** The top bar of every page outside the editor. */
export async function NavBar() {
  const session = await auth();

  return (
    <nav className="pf-nav sticky top-0 z-[100]">
      <Link href="/" aria-label="Start page">
        <Wordmark />
      </Link>
      <span className="pf-nav__links ml-4 hidden md:flex">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="pf-nav__link">
            {link.label}
          </Link>
        ))}
      </span>
      <span className="pf-spacer" />
      {session?.user ? (
        <>
          <Link href="/dashboard" className="pf-nav__link">
            Dashboard
          </Link>
          <Link
            href="/account"
            title={session.user.email ?? "Your account"}
            className="pf-avatar hidden sm:grid"
          >
            {(session.user.email ?? "?").slice(0, 2).toUpperCase()}
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="hidden sm:block"
          >
            <button type="submit" className="pf-btn pf-btn--ghost">
              Log out
            </button>
          </form>
        </>
      ) : (
        <Link href="/login" className="pf-nav__link hidden sm:block">
          Log in
        </Link>
      )}
      <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--lg">
        Open the editor
      </Link>
    </nav>
  );
}
