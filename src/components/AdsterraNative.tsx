import { useEffect, useRef } from "react";

/**
 * Adsterra native banner — sidebar variant for lg screens.
 *
 * Adsterra's invoke.js looks for the EXACT id
 * "container-cd001782380aea119ddb40e7bd8deb20" in the DOM.
 * We must render that id directly — no dynamic suffix.
 * Only mount this component ONCE on the page.
 */
export default function AdsterraNative({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !wrapRef.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://pl30231840.effectivecpmnetwork.com/cd001782380aea119ddb40e7bd8deb20/invoke.js";
    wrapRef.current.appendChild(script);
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      {/* Adsterra looks for this exact id at script execution time */}
      <div id="container-cd001782380aea119ddb40e7bd8deb20" />
    </div>
  );
}