import { useNavigate } from "react-router-dom";
import { HardDrive, ArrowLeft } from "lucide-react";
import AdsterraBanner from "../components/AdsterraBanner";

export default function TermsPage() {
  const navigate = useNavigate();
  const updated = "June 2025";

  return (
    <div className="min-h-screen bg-base-100">
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
        <h1 className="text-3xl font-bold text-base-content mb-2">Terms of Service</h1>
        <p className="text-base-content/40 text-sm mb-10">Last updated: {updated}</p>

        <div className="prose prose-sm max-w-none text-base-content/70 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using TGDrive ("the service"), you agree to be bound by these Terms
              of Service. If you do not agree, please do not use TGDrive.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">2. Description of Service</h2>
            <p>
              TGDrive is a free, open-source, browser-based application that provides an interface
              for managing files stored on Telegram's servers using the official Telegram MTProto API.
              TGDrive itself does not store any user files. All storage is provided by Telegram.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">3. Your Telegram Account</h2>
            <p>
              To use TGDrive you must have a valid Telegram account and API credentials obtained
              from <a href="https://my.telegram.org" target="_blank" rel="noreferrer"
              className="link link-primary">my.telegram.org</a>. You are solely responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Maintaining the security of your API credentials and session</li>
              <li>All activity that occurs under your Telegram account via TGDrive</li>
              <li>Complying with <a href="https://telegram.org/tos" target="_blank" rel="noreferrer" className="link link-primary">Telegram's Terms of Service</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">4. Acceptable Use</h2>
            <p>You agree not to use TGDrive to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Store or distribute illegal content of any kind</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Abuse or overload Telegram's API infrastructure</li>
              <li>Attempt to reverse engineer, hack, or compromise the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">5. No Warranty</h2>
            <p>
              TGDrive is provided "as is" without warranty of any kind, express or implied.
              We do not guarantee that the service will be uninterrupted, error-free, or that
              your files will never be lost. You use TGDrive at your own risk. Always maintain
              independent backups of important files.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, TGDrive and its developers shall not be
              liable for any indirect, incidental, special, or consequential damages arising from
              your use of or inability to use the service, including but not limited to loss of data,
              loss of files, or Telegram account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">7. Third-Party Services</h2>
            <p>
              TGDrive relies on Telegram's API and displays advertisements via Google AdSense.
              These are governed by their respective terms and privacy policies. TGDrive is not
              responsible for the practices of these third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">8. Open Source</h2>
            <p>
              TGDrive is open-source software licensed under the MIT License. The source code is
              available at{" "}
              <a href="https://github.com/fbpatel003/tgdrive" target="_blank" rel="noreferrer"
              className="link link-primary">github.com/fbpatel003/tgdrive</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-base-content mb-3">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be posted on
              this page. Continued use of TGDrive after changes constitutes acceptance.
            </p>
          </section>

        </div>
      </div>

      <AdsterraBanner className="border-t border-base-300" />

      <div className="border-t border-base-300 bg-base-200">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-base-content/30">
          <span>TGDrive — Built by Fenil</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-base-content/60" onClick={() => navigate("/privacy")}>Privacy</span>
            <span className="cursor-pointer hover:text-base-content/60" onClick={() => navigate("/about")}>About</span>
          </div>
        </div>
      </div>
    </div>
  );
}