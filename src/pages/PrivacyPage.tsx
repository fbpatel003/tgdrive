import { useNavigate } from "react-router-dom";
import { HardDrive, ArrowLeft } from "lucide-react";
import AdsterraBanner from "../components/AdsterraBanner";

export default function PrivacyPage() {
  const navigate = useNavigate();
  const updated = "June 2025";

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navbar */}
      <div className="navbar bg-base-200 border-b border-base-300 px-6">
        <div className="flex-1 flex items-center gap-2">
          <HardDrive size={20} className="text-primary" />
          <span className="font-bold text-base-content cursor-pointer" onClick={() => navigate("/")}>TGDrive</span>
        </div>
        <button className="btn btn-ghost btn-sm gap-2" onClick={() => navigate("/")}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-base-content mb-2">Privacy Policy</h1>
        <p className="text-base-content/40 text-sm mb-10">Last updated: {updated}</p>

        <div className="prose prose-sm max-w-none text-base-content/70 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">1. Overview</h2>
            <p>
              TGDrive ("we", "our", or "the application") is a browser-based cloud storage interface
              that allows users to store and manage files using their own Telegram account via the
              official Telegram MTProto API. TGDrive operates entirely in your browser and has
              <strong className="text-base-content"> no backend server</strong>. We do not collect,
              store, or transmit any personal data to our own servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">2. Data We Do NOT Collect</h2>
            <p>Because TGDrive has no backend server, we do not collect:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your name, email address, or phone number</li>
              <li>Your Telegram API credentials (API ID or API Hash)</li>
              <li>Your Telegram session tokens or authentication keys</li>
              <li>Any files you upload or download</li>
              <li>Usage analytics or behavioural data</li>
              <li>IP addresses or device identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">3. Data Stored Locally in Your Browser</h2>
            <p>
              TGDrive stores the following data exclusively in your browser's IndexedDB (local storage).
              This data never leaves your device and is never transmitted to TGDrive servers:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-base-content">Telegram API ID and API Hash</strong> — provided by you, stored locally to authenticate with Telegram</li>
              <li><strong className="text-base-content">Telegram session string and authentication keys</strong> — used to maintain your login session without re-entering credentials</li>
              <li><strong className="text-base-content">File and folder metadata cache</strong> — filenames, sizes, and MIME types cached for faster navigation</li>
              <li><strong className="text-base-content">Image thumbnails</strong> — small preview images cached locally, automatically evicted after 30 days</li>
            </ul>
            <p className="mt-3">
              You can clear all locally stored data at any time by going to your browser settings
              and clearing site data for this domain. Clearing this data will log you out but your
              files on Telegram remain unaffected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">4. Telegram API Usage</h2>
            <p>
              TGDrive communicates directly with Telegram's servers using the MTProto protocol via
              WebSocket connections. Your files, credentials, and session data are transmitted
              directly between your browser and Telegram's infrastructure. This communication is
              governed by <a href="https://telegram.org/privacy" target="_blank" rel="noreferrer"
              className="link link-primary">Telegram's Privacy Policy</a> and{" "}
              <a href="https://telegram.org/tos" target="_blank" rel="noreferrer"
              className="link link-primary">Terms of Service</a>.
            </p>
            <p className="mt-2">
              TGDrive is an independent application and is not affiliated with, endorsed by, or
              officially supported by Telegram.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">5. Google AdSense and Cookies</h2>
            <p>
              TGDrive displays advertisements served by Google AdSense. Google AdSense uses cookies
              and similar tracking technologies to serve personalised advertisements based on your
              visits to this and other websites. Google's use of advertising cookies enables it and
              its partners to serve ads based on your visit to our site and other sites on the internet.
            </p>
            <p className="mt-2">
              You may opt out of personalised advertising by visiting{" "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer"
              className="link link-primary">Google Ads Settings</a> or{" "}
              <a href="http://www.aboutads.info/choices/" target="_blank" rel="noreferrer"
              className="link link-primary">www.aboutads.info</a>.
            </p>
            <p className="mt-2">
              For more information on how Google uses data when you use our site, see:{" "}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank"
              rel="noreferrer" className="link link-primary">
                How Google uses data when you use our partners' sites or apps
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">6. Third-Party Links</h2>
            <p>
              TGDrive may contain links to external websites (such as my.telegram.org and
              Telegram's documentation). We are not responsible for the privacy practices or content
              of those sites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">7. Children's Privacy</h2>
            <p>
              TGDrive is not directed at children under the age of 13. We do not knowingly collect
              personal information from children. If you are under 13, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated date. Continued use of TGDrive after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">9. Contact</h2>
            <p>
              For questions about this Privacy Policy, please open an issue on our{" "}
              <a href="https://github.com/fbpatel003/tgdrive" target="_blank" rel="noreferrer"
              className="link link-primary">GitHub repository</a>.
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <AdsterraBanner className="border-t border-base-300" />

      <div className="border-t border-base-300 bg-base-200">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-base-content/30">
          <span>TGDrive — Built by Fenil</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-base-content/60" onClick={() => navigate("/terms")}>Terms</span>
            <span className="cursor-pointer hover:text-base-content/60" onClick={() => navigate("/about")}>About</span>
          </div>
        </div>
      </div>
    </div>
  );
}