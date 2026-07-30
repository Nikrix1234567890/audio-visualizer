import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function NavBar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between border-b border-hairline bg-chassis px-6 py-3 text-sm text-cream">
      <Link href="/" className="font-semibold tracking-tight">
        Audio<span className="text-amber">Visualizer</span>
      </Link>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <Link href="/dashboard" className="text-steel hover:text-cream">
              Dashboard
            </Link>
            <span className="font-mono text-xs text-steel">
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
                className="rounded-md border border-hairline px-3 py-1 text-cream hover:border-amber-dim hover:text-amber"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-steel hover:text-cream">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-amber px-3 py-1 font-medium text-chassis hover:bg-amber/90"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
