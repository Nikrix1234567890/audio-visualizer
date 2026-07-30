import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function NavBar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-3 text-sm text-zinc-200">
      <Link href="/" className="font-semibold tracking-tight">
        Audio Visualizer
      </Link>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <span className="text-zinc-500">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-zinc-700 px-3 py-1 hover:bg-zinc-800"
              >
                Abmelden
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-white">
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-white px-3 py-1 font-medium text-zinc-950 hover:bg-zinc-200"
            >
              Registrieren
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
