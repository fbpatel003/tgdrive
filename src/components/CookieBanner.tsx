import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

const COOKIE_KEY = "tgdrive_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-base-200 border border-base-300 rounded-xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Cookie size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-base-content/60 leading-relaxed">
            TGDrive uses cookies from Google AdSense to serve relevant ads.
            No personal data is collected by TGDrive itself.{" "}
            <a href="/privacy" className="link link-primary">Learn more</a>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="btn btn-ghost btn-xs" onClick={decline}>Decline</button>
          <button className="btn btn-primary btn-xs" onClick={accept}>Accept</button>
        </div>
      </div>
    </div>
  );
}