import { useEffect, useRef } from "react";

/**
 * Adsterra responsive leaderboard banner.
 * Shows 728×90 on desktop, 320×50 on mobile.
 * Replaces AdSense — same slim bar look.
 */

const DESKTOP = {
  key: "a75d0b7b08adb883ab3f1fcf177def11",
  width: 728,
  height: 90,
};

const MOBILE = {
  key: "fee60e7c0fb009e7fa2d624ed1889c38",
  width: 320,
  height: 50,
};

let counter = 0;

export default function AdsterraBanner({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(`at-banner-${++counter}`);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;

    const isMobile = window.innerWidth < 768;
    const cfg = isMobile ? MOBILE : DESKTOP;

    // atOptions must be set before invoke.js loads
    (window as unknown as Record<string, unknown>)["atOptions"] = {
      key: cfg.key,
      format: "iframe",
      height: cfg.height,
      width: cfg.width,
      params: {},
    };

    const script = document.createElement("script");
    script.src = `https://www.highperformanceformat.com/${cfg.key}/invoke.js`;
    ref.current.appendChild(script);
  }, []);

  return (
    <div
      ref={ref}
      id={id.current}
      className={`flex justify-center items-center overflow-hidden ${className}`}
      style={{ minHeight: 50 }}
    />
  );
}