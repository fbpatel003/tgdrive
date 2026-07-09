import { useEffect, useRef } from "react";

let counter = 0;

/**
 * Adsterra native banner — vertical sidebar variant.
 * Only renders on lg screens (hidden on smaller viewports via CSS).
 */
export default function AdsterraNative({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(`at-native-${++counter}`);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;

    const inner = document.createElement("div");
    inner.id = `container-cd001782380aea119ddb40e7bd8deb20-${id.current}`;
    ref.current.appendChild(inner);

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl30231840.effectivecpmnetwork.com/cd001782380aea119ddb40e7bd8deb20/invoke.js";
    ref.current.appendChild(script);
  }, []);

  return (
    <div
      ref={ref}
      id={id.current}
      className={`hidden lg:block ${className}`}
    />
  );
}