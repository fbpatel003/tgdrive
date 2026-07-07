import { Heart } from "lucide-react";

const SMART_LINK = "https://www.effectivecpmnetwork.com/me98w02a?key=c5d9a533cb68762aa7500f4c6e2d133b";

export default function SupportBanner() {
  return (
    <div className="border-t border-base-300 bg-base-200/60 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-base-content/40">
          <Heart size={13} className="text-error/60" />
          <span>TGDrive is free and open source. Support keeps it running.</span>
        </div>
        <a
          href={SMART_LINK}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-xs btn-outline border-primary/40 text-primary/70 hover:btn-primary gap-1.5 flex-shrink-0"
        >
          <Heart size={11} />
          Support by viewing an ad
        </a>
      </div>
    </div>
  );
}