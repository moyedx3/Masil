"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { ReactNode, useEffect } from "react";

const APP_ID = "app_e46be27bec413add7207c6d40b28d906";

export function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const result = MiniKit.install(APP_ID);
    console.log("MiniKit install result:", result);
  }, []);

  return <>{children}</>;
}
