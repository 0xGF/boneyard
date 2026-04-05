"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ArrowUpRightIcon } from "@/components/ui/icons/arrow-up-right";
import { GithubIcon } from "@/components/ui/icons/github";
import { MenuIcon, type MenuIconHandle } from "@/components/ui/icons/menu";
import { XIcon, type XIconHandle } from "@/components/ui/icons/x";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/install", label: "Install" },
  { href: "/features", label: "Features" },
  { href: "/responsive", label: "Responsive" },
  { href: "/performance", label: "Performance" },
  { href: "/ssr", label: "SSR" },
  { href: "/output", label: "Output" },
];

const exampleItems = [
  { href: "/demo", label: "Complex Example" },
  { href: "/try-it", label: "Examples" },
  { href: "/agent", label: "Agent" },
  { href: "/changelog", label: "Changelog" },
];

const externalLinks = [
  { href: "https://github.com/0xGF/boneyard", label: "GitHub" },
  { href: "https://www.npmjs.com/package/boneyard-js", label: "npm" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<MenuIconHandle>(null);
  const xRef = useRef<XIconHandle>(null);

  const renderNavItem = (item: { href: string; label: string }, onClick?: () => void) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onClick}
          className={`relative block py-1.5 text-[14px] transition-colors ${isActive
            ? "text-[#1c1917] font-semibold"
            : "text-[#a8a29e] hover:text-[#78716c]"
            }`}
        >
          {isActive && (
            <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-[#1c1917] rounded-full" />
          )}
          {item.label}
        </Link>
      </li>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="pt-12 md:pt-30 pb-8">
        <Link href="/overview">
          <Logo />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-0.5 mb-6 pl-3">
          {navItems.map((item) => renderNavItem(item, () => setOpen(false)))}
        </ul>

        <ul className="space-y-0.5 mb-6 pl-3">
          {exampleItems.map((item) => renderNavItem(item, () => setOpen(false)))}
        </ul>

        <ul className="space-y-0.5 pl-3">
          {externalLinks.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1.5 text-[14px] text-[#a8a29e] hover:text-[#78716c] transition-colors"
              >
                {item.label}
                <ArrowUpRightIcon size={10} className="opacity-40 inline-block ml-1" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="py-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#a8a29e]">v1.0.0</span>
          <a
            href="https://github.com/0xGF/boneyard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a8a29e] hover:text-[#78716c] transition-colors"
          >
            <GithubIcon size={14} className="opacity-40" />
          </a>
        </div>
        <a
          href="https://x.com/0xGoodfuture"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 group"
        >
          <Image
            src="/gf.jpg"
            alt="@0xGF"
            width={22}
            height={22}
            className="rounded-full"
          />
          <span className="text-[11px] text-[#a8a29e] group-hover:text-[#78716c] transition-colors">
            designed by 0xGF
          </span>
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — logo + hamburger */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-9 h-14 bg-[#fafaf9]/90 backdrop-blur-md border-b border-stone-200/60">
        <Link href="/overview" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-stone-100 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            <XIcon ref={xRef} size={18} className="text-[#1c1917]" />
          ) : (
            <MenuIcon ref={menuRef} size={18} className="text-[#1c1917]" />
          )}
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/10 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar - flows in layout */}
      <aside className="hidden md:flex flex-col w-[200px] shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - slides down from top bar */}
      <aside
        className={`fixed top-14 left-0 right-0 z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col bg-[#fafaf9]/95 backdrop-blur-md border-b border-stone-200/60 px-6 pb-4 transition-all duration-200 md:hidden ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
      >
        {/* Nav items only — no logo in the dropdown */}
        <nav className="pt-3">
          <ul className="space-y-0.5 mb-4 pl-3">
            {navItems.map((item) => renderNavItem(item, () => setOpen(false)))}
          </ul>

          <ul className="space-y-0.5 mb-4 pl-3">
            {exampleItems.map((item) => renderNavItem(item, () => setOpen(false)))}
          </ul>

          <ul className="space-y-0.5 pl-3">
            {externalLinks.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1.5 text-[14px] text-[#a8a29e] hover:text-[#78716c] transition-colors"
                >
                  {item.label}
                  <ArrowUpRightIcon size={10} className="opacity-40 inline-block ml-1" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
