"use client";

import { NavProvider } from "@/app/components/NavContext";
import BottomNav from "@/app/components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavProvider>
      {children}
      <BottomNav />
    </NavProvider>
  );
}
