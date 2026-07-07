import { useEffect, useRef } from "react";

/**
 * Adsterra Native Banner
 * Renders once per mount. Safe to use on multiple pages —
 * each instance gets a unique container id to avoid conflicts.
 */

let instanceCount = 0;

export default function AdsterraBanner({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`adsterra-${++instanceCount}`);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    // Create the inner div with the real Adsterra container id
    const inner = document.createElement("div");
    inner.id = "container-cd001782380aea119ddb40e7bd8deb20";
    containerRef.current.appendChild(inner);

    // Inject the Adsterra invoke script
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl30231840.effectivecpmnetwork.com/cd001782380aea119ddb40e7bd8deb20/invoke.js";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      id={idRef.current}
      className={`w-full overflow-hidden ${className}`}
    />
  );
}