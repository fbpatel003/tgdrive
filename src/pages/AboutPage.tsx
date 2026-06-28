import { useNavigate } from "react-router-dom";
import { HardDrive, ArrowLeft, Shield, Zap, FolderOpen, Code2, Lock, Server, Wifi } from "lucide-react";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-100">
      <div className="navbar bg-base-200 border-b border-base-300 px-6">
        <div className="flex-1 flex items-center gap-2">
          <HardDrive size={20} className="text-primary" />
          <span className="font-bold text-base-content cursor-pointer" onClick={() => navigate("/")}>TGDrive</span>
        </div>
        <button className="btn btn-ghost btn-sm gap-2" onClick={() => navigate("/")}>
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14">

        {/* Hero */}
        <div className="mb-14">
          <h1 className="text-4xl font-bold text-base-content mb-4">About TGDrive</h1>
          <p className="text-base-content/60 text-lg leading-relaxed max-w-2xl">
            TGDrive is a free, open-source web application that turns your existing Telegram account
            into unlimited cloud storage — with no subscriptions, no server costs, and no middleman.
          </p>
        </div>

        {/* What is it */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-base-content mb-4">What is TGDrive?</h2>
          <div className="text-base-content/60 space-y-4 leading-relaxed">
            <p>
              Telegram is one of the world's largest messaging platforms, with servers distributed
              globally. Every Telegram account comes with effectively unlimited cloud storage —
              files sent to your "Saved Messages" or private channels persist on Telegram's servers
              indefinitely, accessible from any device.
            </p>
            <p>
              TGDrive provides a familiar Google Drive-style interface on top of this storage.
              You create folders (which become private Telegram channels), upload files, preview
              images and stream videos — all through a clean, fast browser interface.
            </p>
            <p>
              Unlike traditional cloud storage services, TGDrive has no backend server of its own.
              Your browser connects directly to Telegram's servers using the official MTProto API —
              the same protocol used by Telegram's own apps. Your files, credentials, and session
              data never pass through TGDrive infrastructure because there is no TGDrive infrastructure.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-base-content mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: <Wifi size={20} className="text-primary" />,
                title: "Direct MTProto Connection",
                desc: "Your browser opens a WebSocket connection directly to Telegram's servers using the MTProto protocol — the same protocol Telegram's official apps use. No proxy, no middleman.",
              },
              {
                icon: <FolderOpen size={20} className="text-primary" />,
                title: "Folders as Private Channels",
                desc: "Each folder you create in TGDrive becomes a private Telegram channel tagged [TGDrive]. Files are stored as document attachments inside these channels.",
              },
              {
                icon: <Lock size={20} className="text-primary" />,
                title: "Local Session Storage",
                desc: "Your API credentials and Telegram session are stored exclusively in your browser's IndexedDB. They are never sent to any TGDrive server — because there isn't one.",
              },
              {
                icon: <Server size={20} className="text-primary" />,
                title: "Telegram as the Backend",
                desc: "Telegram's global infrastructure handles all storage, redundancy, and availability. TGDrive is purely a frontend — a UI layer over the Telegram API.",
              },
              {
                icon: <Zap size={20} className="text-primary" />,
                title: "Streaming Video Playback",
                desc: "Videos are streamed using a Service Worker that intercepts HTTP Range requests from the browser's video player — fetching Telegram chunks on demand, just like professional streaming services.",
              },
              {
                icon: <Shield size={20} className="text-primary" />,
                title: "No Account Required from Us",
                desc: "You don't register with TGDrive. You use your own Telegram account and your own API credentials from my.telegram.org. We have no account database.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-base-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 rounded-lg p-2">{item.icon}</div>
                  <h3 className="font-semibold text-base-content text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-base-content/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture diagram (text) */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-base-content mb-4">Architecture</h2>
          <div className="bg-base-200 rounded-xl p-6 font-mono text-sm text-base-content/60 leading-relaxed">
            <p className="text-base-content/80 mb-1">Your Browser</p>
            <p className="ml-4">├── React UI (TGDrive interface)</p>
            <p className="ml-4">├── GramJS (Telegram MTProto client)</p>
            <p className="ml-4">├── Service Worker (video range requests)</p>
            <p className="ml-4">├── IndexedDB (session + metadata cache)</p>
            <p className="ml-4">└── WebSocket ──────────────────────────► Telegram Servers</p>
            <p className="ml-12 text-base-content/40">└── Your files stored here permanently</p>
            <p className="mt-4 text-base-content/40 text-xs"># No TGDrive server exists between you and Telegram</p>
          </div>
        </section>

        {/* Tech stack */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-base-content mb-6">Technology Stack</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "React 18", "TypeScript", "Vite", "GramJS", "MTProto",
              "Dexie.js (IndexedDB)", "Tailwind CSS", "DaisyUI", "Service Workers",
              "React Router", "GitHub Pages", "GitHub Actions",
            ].map((tech) => (
              <span key={tech} className="badge badge-outline badge-md">{tech}</span>
            ))}
          </div>
        </section>

        {/* Open source */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-base-content mb-4">Open Source</h2>
          <p className="text-base-content/60 leading-relaxed mb-4">
            TGDrive is fully open-source under the MIT License. You can inspect every line of code,
            run your own instance, or contribute improvements. Because TGDrive has no backend,
            self-hosting means simply serving the static files — deployable for free on GitHub Pages,
            Vercel, Netlify, or any static host.
          </p>
          <a
            href="https://github.com/fbpatel003/tgdrive"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm gap-2"
          >
            <Code2 size={14} /> View on GitHub
          </a>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-base-content mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is TGDrive affiliated with Telegram?",
                a: "No. TGDrive is an independent, community-built project. It uses Telegram's official public API but is not affiliated with, endorsed by, or officially supported by Telegram Messenger Inc.",
              },
              {
                q: "What is the storage limit?",
                a: "Telegram does not impose a storage quota on user accounts. Individual files are limited to 2 GB each. You can upload as many files as you want across as many folders as you need.",
              },
              {
                q: "What happens if I clear my browser data?",
                a: "Your local session, cached metadata, and thumbnails are cleared. You will need to log in again. However, all your files remain permanently on Telegram's servers and will reappear after re-authentication.",
              },
              {
                q: "Is my data safe?",
                a: "Your files are as safe as your Telegram account. TGDrive never sees your data — everything flows directly between your browser and Telegram. Keep your Telegram account secure and enable two-factor authentication on your Telegram account.",
              },
              {
                q: "Does TGDrive work on mobile?",
                a: "Yes. TGDrive is a responsive web app and works in mobile browsers on Android and iOS. For the best experience use Chrome or Firefox.",
              },
              {
                q: "Can I use TGDrive for free?",
                a: "Yes, TGDrive is completely free. It is sustained by non-intrusive Google AdSense advertisements displayed on the drive interface. The login and documentation pages are ad-free.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-base-200 rounded-xl px-5 py-4">
                <p className="font-semibold text-sm text-base-content mb-2">{item.q}</p>
                <p className="text-sm text-base-content/50 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built by */}
        <section>
          <h2 className="text-2xl font-bold text-base-content mb-4">Built By</h2>
          <p className="text-base-content/60 leading-relaxed">
            TGDrive was designed and built by{" "}
            <a href="https://github.com/fbpatel003" target="_blank" rel="noreferrer" className="link link-primary font-medium">
              Fenil
            </a>{" "}
            as an open-source tool for personal and community use. Contributions, bug reports, and
            feature suggestions are welcome via{" "}
            <a href="https://github.com/fbpatel003/tgdrive/issues" target="_blank" rel="noreferrer" className="link link-primary">
              GitHub Issues
            </a>.
          </p>
        </section>

      </div>

      <div className="border-t border-base-300 bg-base-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-base-content/30">
          <span>TGDrive — Built by Fenil · {new Date().getFullYear()}</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-base-content/60" onClick={() => navigate("/privacy")}>Privacy Policy</span>
            <span className="cursor-pointer hover:text-base-content/60" onClick={() => navigate("/terms")}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}