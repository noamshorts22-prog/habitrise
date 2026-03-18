"use client";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered successfully, scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[SW] Registration failed:", err);
        });
    } else {
      console.warn("[SW] Service Workers not supported in this browser");
    }
  }, []);
  return null;
}
