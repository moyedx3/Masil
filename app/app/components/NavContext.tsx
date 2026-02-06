"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface NavContextType {
  hideNav: boolean;
  setHideNav: (v: boolean) => void;
}

const NavContext = createContext<NavContextType>({
  hideNav: false,
  setHideNav: () => {},
});

export function NavProvider({ children }: { children: ReactNode }) {
  const [hideNav, setHideNav] = useState(false);
  return (
    <NavContext.Provider value={{ hideNav, setHideNav }}>
      {children}
    </NavContext.Provider>
  );
}

export const useNav = () => useContext(NavContext);
