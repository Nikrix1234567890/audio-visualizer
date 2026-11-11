import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Wordmark } from "@/components/Wordmark";

export async function NavBar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between border-b border-line bg-canvas px-6 py-3 text-sm text-ink">
      <Link href="/" className="outline-none focus-visible:opacity-80">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/editor" className="text-muted hover:text-ink">
          Editor
        </Link>
        <Link href="/pricing" className="text-muted hover:text-ink">
          Pricing
        </Link>
        {session?.user ? (
          <>
            <Link href="/dashboard" className="text-muted hover:text-ink">
              Dashboard
            </Link>
            <span className="font-mono text-xs text-muted">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-line px-3 py-1 text-ink hover:border-accent-dim hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-muted hover:text-ink">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand px-3 py-1 font-medium text-canvas hover:brightness-110"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
