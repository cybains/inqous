import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import Link from "next/link";
import type { Metadata } from "next";

// --- Optional: basic SEO for the landing page ---
export const metadata: Metadata = {
  title: "Welcome | Inquos",
  description:
    "Move faster with the right partners. Direct clients, agencies, employers, education and service providers – on one platform.",
};

// Persona types and friendly labels
const personaKeys = [
  "direct",
  "agency",
  "recruiter",
  "employer",
  "edu",
  "service",
] as const;

export type PersonaKey = (typeof personaKeys)[number];
export type Persona =
  | "Direct Client"
  | "Agency (with clients)"
  | "Recruiter / Talent Supplier"
  | "Direct Employer"
  | "Education Provider"
  | "Service Provider";

const labelFromKey: Record<PersonaKey, Persona> = {
  direct: "Direct Client",
  agency: "Agency (with clients)",
  recruiter: "Recruiter / Talent Supplier",
  employer: "Direct Employer",
  edu: "Education Provider",
  service: "Service Provider",
};

const profileTextFromPersona: Record<Persona, string> = {
  "Direct Client": "Looking for a Job",
  "Agency (with clients)": "Other Think Tanks",
  "Recruiter / Talent Supplier": "Recruiter / Talent Supplier",
  "Direct Employer": "Looking for Staff",
  "Education Provider": "Educational Institutions",
  "Service Provider": "Other Services",
};

function isPersonaKey(v: unknown): v is PersonaKey {
  return typeof v === "string" && (personaKeys as readonly string[]).includes(v);
}

function personaFromQuery(q: unknown): PersonaKey {
  return isPersonaKey(q) ? q : "direct";
}

function modeFromQuery(v: unknown): "idle" | "login" | "register" {
  return v === "login" || v === "register" ? (v as any) : "idle";
}

function joinHref(persona: PersonaKey) {
  return `/?mode=register&persona=${encodeURIComponent(persona)}`;
}

function loginHref() {
  return "/?mode=login";
}

function closeHref() {
  return "/";
}

function googleSignInHref(callbackUrl: string) {
  const cb = encodeURIComponent(callbackUrl);
  return `/api/auth/signin/google?callbackUrl=${cb}`;
}

function googleSignOutHref() {
  return "/api/auth/signout";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);

  // derive UI state from URL (SSR: no client state needed)
  const mode = modeFromQuery(searchParams?.mode);
  const personaKey = personaFromQuery(searchParams?.persona);
  const persona = labelFromKey[personaKey];
  const isAuthed = Boolean(session?.user);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top nav */}
      <header className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="font-semibold text-lg tracking-tight">inquos</div>
        <nav className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
              >
                Go to dashboard
              </Link>
              <Link
                href={googleSignOutHref()}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link href={loginHref()} className="px-4 py-2 rounded border">
                Log in
              </Link>
              <Link
                href={joinHref(personaKey)}
                className="px-4 py-2 rounded bg-black text-white"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left copy */}
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Move faster with the right partners.
            </h1>
            <p className="mt-4 text-gray-600">
              Direct clients, agencies, employers, education and service providers — on one
              platform. Verify your email, get approved (if you're an org), and start
              working together.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isAuthed ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-5 py-3 rounded bg-black text-white hover:bg-gray-800"
                  >
                    Go to dashboard
                  </Link>
                  <Link
                    href={googleSignOutHref()}
                    className="px-5 py-3 rounded border hover:bg-gray-50"
                  >
                    Sign out
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={joinHref(personaKey)}
                    className="px-5 py-3 rounded bg-black text-white"
                  >
                    Create account
                  </Link>
                  <Link href={loginHref()} className="px-5 py-3 rounded border">
                    I already have an account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right card with inline overlays */}
          <div
            className={[
              "relative rounded-2xl border p-6 transition-colors",
              "min-h-[420px] md:min-h-[460px]",
              mode === "register" ? "bg-black text-white border-black" : "bg-white",
            ].join(" ")}
          >
            {mode === "login" && (
              <LoginInline isAuthed={isAuthed} />
            )}
            {mode === "register" && (
              <RegisterInline personaKey={personaKey} />
            )}

            {/* Card content (visible beneath overlays) */}
            <div className="text-sm font-medium mb-3">Get started</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Direct Clients</span>
                <Link href={joinHref("direct")} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </li>
              <li className="flex items-center justify-between">
                <span>Agencies with Clients</span>
                <Link href={joinHref("agency")} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </li>
              <li className="flex items-center justify-between">
                <span>Recruiters & Talent Suppliers</span>
                <Link href={joinHref("recruiter")} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </li>
              <li className="flex items-center justify-between">
                <span>Direct Employers</span>
                <Link href={joinHref("employer")} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </li>
              <li className="flex items-center justify-between">
                <span>Education Providers</span>
                <Link href={joinHref("edu")} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </li>
              <li className="flex items-center justify-between">
                <span>Service Providers</span>
                <Link href={joinHref("service")} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </li>
            </ul>

            <div className="mt-6 text-xs text-gray-500">
              Signing up takes less than 2 minutes.
            </div>
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-semibold mb-6">Who is Inquos for?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {personaKeys.map((key) => (
              <div key={key} className="rounded-xl border bg-white p-5">
                <div className="text-sm font-medium mb-1">{labelFromKey[key]}</div>
                <p className="text-gray-600 mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut velit vel arcu facilisis luctus.
                </p>
                <Link href={joinHref(key)} className="text-xs px-3 py-1 rounded border">
                  Join
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-2xl border p-8 text-center bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="mt-3 text-sm text-white/70">
            Verify your email, get approved, and start collaborating.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {isAuthed ? (
              <>
                <Link href="/dashboard" className="px-5 py-3 rounded bg-white text-black">
                  Go to dashboard
                </Link>
                <Link
                  href={googleSignOutHref()}
                  className="px-5 py-3 rounded border border-white/40"
                >
                  Sign out
                </Link>
              </>
            ) : (
              <>
                <Link href={joinHref(personaKey)} className="px-5 py-3 rounded bg-white text-black">
                  Create account
                </Link>
                <Link href={loginHref()} className="px-5 py-3 rounded border border-white/40">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- Inline overlays (server-rendered via URL state) ---------------- */
function LoginInline({ isAuthed }: { isAuthed: boolean }) {
  if (isAuthed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      className="absolute inset-0 z-20 rounded-2xl bg-white shadow-xl p-6 overflow-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <div id="login-title" className="text-sm font-medium">
          Welcome back
        </div>
        <Link
          href={closeHref()}
          className="w-8 h-8 rounded hover:bg-black/5 flex items-center justify-center"
          aria-label="Close login"
        >
          ×
        </Link>
      </div>

      {/* Keep simple: we only wire Google SSO for working functionality */}
      <div className="space-y-3">
        <input className="w-full border border-black/10 p-2 rounded" placeholder="Email" disabled />
        <input className="w-full border border-black/10 p-2 rounded" placeholder="Password" disabled />
        <p className="text-sm text-gray-500">Use Google to continue.</p>

        <Link
          href={googleSignInHref("/dashboard")}
          className="block w-full text-center p-2 rounded bg-black text-white"
        >
          Continue with Google
        </Link>
      </div>
    </div>
  );
}

function RegisterInline({ personaKey }: { personaKey: PersonaKey }) {
  const persona = labelFromKey[personaKey];
  const friendly = profileTextFromPersona[persona];
  const callbackUrl = `/onboarding?persona=${encodeURIComponent(personaKey)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      className="absolute inset-0 z-20 rounded-2xl bg-black text-white shadow-xl p-6 overflow-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <div id="register-title" className="text-sm font-medium">
          {friendly}
        </div>
        <Link
          href={closeHref()}
          className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
          aria-label="Close register"
          title={persona}
        >
          ×
        </Link>
      </div>

      {/* SSO-first: password fields are presentational only */}
      <div className="space-y-3">
        <input
          className="w-full border border-white/20 bg-transparent p-2 rounded placeholder-white/60"
          placeholder="Email (use Google below)"
          type="email"
          disabled
        />
        <input
          className="w-full border border-white/20 bg-transparent p-2 rounded placeholder-white/60"
          placeholder="Select a password (SSO recommended)"
          type="password"
          disabled
        />
        <input
          className="w-full border border-white/20 bg-transparent p-2 rounded placeholder-white/60"
          placeholder="Confirm password"
          type="password"
          disabled
        />

        <p className="text-sm text-white/70">Sign up with Google to continue.</p>

        <Link
          href={googleSignInHref(callbackUrl)}
          className="block w-full text-center p-2 rounded bg-white text-black"
        >
          Sign up with Google
        </Link>
      </div>
    </div>
  );
}
