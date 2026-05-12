import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, expectedToken, sha256Hex } from "@/lib/auth";

export const metadata = { title: "Sign in" };

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");
  const expected = await expectedToken();
  if (!expected) {
    redirect("/login?error=unconfigured");
  }
  const submitted = await sha256Hex(password);
  if (submitted !== expected) {
    redirect(`/login?error=wrong&next=${encodeURIComponent(next)}`);
  }
  const jar = await cookies();
  jar.set(AUTH_COOKIE, submitted, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  redirect(next.startsWith("/") ? next : "/");
}

export default async function LoginPage(
  props: PageProps<"/login">,
) {
  const search = await props.searchParams;
  const error = typeof search.error === "string" ? search.error : null;
  const next = typeof search.next === "string" ? search.next : "/";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm bg-white border border-[var(--border)] rounded-xl shadow-sm p-8 space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
            Project Site
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Internal team site
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the shared team password to continue.
          </p>
        </div>

        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoFocus
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
          />
        </label>

        {error === "wrong" && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            Incorrect password.
          </p>
        )}
        {error === "unconfigured" && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Site password is not configured. Set <code>SITE_PASSWORD</code> in
            your environment variables.
          </p>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition"
        >
          Sign in
        </button>

        <p className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
          Lost the password? Ask your Project Lead.
        </p>
      </form>
    </div>
  );
}
