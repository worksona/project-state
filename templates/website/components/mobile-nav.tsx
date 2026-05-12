"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Item = { href: string; label: string; description?: string };

export default function MobileNav({
  primary,
  progress,
  about,
}: {
  primary: Item[];
  progress: Item[];
  about: Item[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="lg:hidden ml-auto -mr-2 p-2 rounded-md text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 top-[57px] z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute inset-x-0 top-0 bg-white border-b border-[var(--border)] shadow-xl max-h-[calc(100vh-57px)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Section label="Site">
              {primary.map((n) => (
                <NavLink key={n.href} item={n} active={pathname === n.href} onClick={() => setOpen(false)} />
              ))}
            </Section>
            <Section label="Progress">
              {progress.map((n) => (
                <NavLink key={n.href} item={n} active={pathname === n.href} onClick={() => setOpen(false)} />
              ))}
            </Section>
            <Section label="About">
              {about.map((n) => (
                <NavLink key={n.href} item={n} active={pathname === n.href} onClick={() => setOpen(false)} />
              ))}
            </Section>
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <a
                href="/api/auth/logout"
                className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
              >
                Sign out
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)] py-3">
      <div className="px-5 pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        {label}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: Item;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={`block px-5 py-3 transition ${
          active
            ? "bg-slate-50 text-[var(--accent)] border-l-2 border-[var(--accent)]"
            : "text-slate-700 hover:bg-slate-50 border-l-2 border-transparent"
        }`}
      >
        <div className="text-base font-medium">{item.label}</div>
        {item.description && (
          <div className="mt-0.5 text-xs text-[var(--muted)] leading-snug">
            {item.description}
          </div>
        )}
      </Link>
    </li>
  );
}
