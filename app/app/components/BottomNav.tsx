"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useNav } from "./NavContext";

function MapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"
        fill="currentColor"
      />
    </svg>
  );
}

const tabs = [
  { href: "/home", label: "Map", icon: <MapIcon /> },
  { href: "/profile", label: "Profile", icon: <PersonIcon /> },
  { href: "/about", label: "About", icon: <InfoIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { hideNav } = useNav();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 right-0 z-30 bg-[#F7F4EA] border-t border-[#D2DCB6] transition-transform duration-200 ease-out ${
        hideNav ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
                isActive ? "text-[#B87C4C]" : "text-[#778873]"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
