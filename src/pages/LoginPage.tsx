import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { PromisedWebSockets } from "telegram/extensions/PromisedWebSockets";
import { db } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import AdsterraBanner from "../components/AdsterraBanner";
import {
  HardDrive, KeyRound, Phone, ShieldCheck,
  ExternalLink, FolderOpen, Upload, Shield,
  Code2, Globe, ChevronDown, ChevronUp, Lock, Zap
} from "lucide-react";

type Step = "credentials" | "phone" | "otp";

const STEPS = [
  {
    num: "01",
    title: "Get API credentials",
    desc: (
      <>
        Go to{" "}
        <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="link link-primary font-medium">
          my.telegram.org
        </a>{" "}
        → Log in → <span className="font-medium text-base-content/80">API Development Tools</span> → create an app. Copy your <span className="font-medium text-base-content/80">API ID</span> and <span className="font-medium text-base-content/80">API Hash</span>.
      </>
    ),
    icon: <KeyRound size={15} className="text-primary" />,
  },
  {
    num: "02",
    title: "Sign in with your phone",
    desc: "Paste your API credentials here, enter your Telegram phone number, and verify with the OTP sent to your Telegram app.",
    icon: <Phone size={15} className="text-primary" />,
  },
  {
    num: "03",
    title: "Create folders & upload",
    desc: "Each folder you create becomes a private Telegram channel tagged [TGDrive]. Files you upload are sent as messages inside those channels — stored forever on Telegram's servers.",
    icon: <FolderOpen size={15} className="text-primary" />,
  },
  {
    num: "04",
    title: "Access from anywhere",
    desc: "Your files are tied to your Telegram account, not this device. Log in from any browser and everything is there. Even if you clear your browser, just log in again.",
    icon: <Globe size={15} className="text-primary" />,
  },
];

const FAQS = [
  {
    q: "Is my data safe?",
    a: "Your API credentials and session are stored only in your browser's IndexedDB — nothing is sent to any TGDrive server. Files go directly from your browser to Telegram's servers via the MTProto protocol.",
  },
  {
    q: "What's the storage limit?",
    a: "Telegram doesn't enforce a storage quota on user accounts. You can upload as much as you want. Individual file size limit is 2 GB per file.",
  },
  {
    q: "What happens if I clear browser data?",
    a: "Your session and local cache are lost, but your files remain safe on Telegram forever. Just log in again and everything reappears.",
  },
  {
    q: "Is this affiliated with Telegram?",
    a: "No. TGDrive is an independent open-source tool that uses Telegram's official MTProto API. It is not endorsed by or affiliated with Telegram.",
  },
  {
    q: "Can others see my files?",
    a: "No. Folders are created as private Telegram channels visible only to your account. No one else has access.",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [client, setClient] = useState<TelegramClient | null>(null);
  const [phoneCodeHash, setPhoneCodeHash] = useState("");

  const handleCredentials = () => {
    setError("");
    if (!apiId || !apiHash) return setError("Both API ID and API Hash are required.");
    if (isNaN(Number(apiId))) return setError("API ID must be a number.");
    setStep("phone");
  };

  const handlePhone = async () => {
    setError("");
    setLoading(true);
    try {
      const session = new StringSession("");
      const tgClient = new TelegramClient(session, Number(apiId), apiHash, {
        connectionRetries: 5,
        useWSS: true,
        networkSocket: PromisedWebSockets,
      });
      await tgClient.connect();
      const result = await tgClient.sendCode({ apiId: Number(apiId), apiHash }, phone);
      setPhoneCodeHash(result.phoneCodeHash);
      setClient(tgClient);
      setStep("otp");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async () => {
    setError("");
    setLoading(true);
    try {
      if (!client) throw new Error("Client not initialized");
      await client.invoke(
        new (await import("telegram/tl")).Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash,
          phoneCode: otp,
        })
      );
      const sessionString = client.session.save() as unknown as string;
      await db.credentials.put({ id: 1, apiId: Number(apiId), apiHash, sessionString, phone });
      refresh();
      navigate("/drive");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid code.";
      if (msg.includes("SESSION_PASSWORD_NEEDED")) {
        setError("2FA is enabled. 2FA support coming soon.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">

      {/* ── Navbar ── */}
      <div className="navbar bg-base-200 border-b border-base-300 px-6">
        <div className="flex-1 flex items-center gap-2">
          <HardDrive size={20} className="text-primary" />
          <span className="font-bold text-base-content">TGDrive</span>
          <span className="badge badge-primary badge-outline badge-xs ml-1">Beta</span>
        </div>
        <div className="flex-none flex items-center gap-3 text-xs text-base-content/40">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-base-content/70 transition-colors">
            <Code2 size={14} /> GitHub
          </a>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* Left — info side */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-5">
              <Zap size={12} /> Free · Unlimited · No server
            </div>
            <h1 className="text-4xl font-bold text-base-content leading-tight mb-4">
              Your Telegram account<br />
              <span className="text-primary">as unlimited cloud storage</span>
            </h1>
            <p className="text-base-content/60 text-base mb-8 max-w-lg">
              TGDrive uses Telegram's MTProto API directly from your browser — no middleman server, no subscription, no storage limit. Your files live on Telegram's infrastructure forever.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-10">
              {[
                { icon: <Shield size={13} />, label: "Zero-server privacy" },
                { icon: <Upload size={13} />, label: "Up to 2 GB per file" },
                { icon: <FolderOpen size={13} />, label: "Folder organisation" },
                { icon: <Lock size={13} />, label: "Credentials stay in your browser" },
              ].map((f) => (
                <span key={f.label} className="flex items-center gap-1.5 text-xs bg-base-200 text-base-content/60 px-3 py-1.5 rounded-lg">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>

            {/* How to start */}
            <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-widest mb-5">How to get started</h2>
            <div className="space-y-4">
              {STEPS.map((s) => (
                <div key={s.num} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-primary font-mono font-bold">{s.num}</span>
                      <span className="text-sm font-semibold text-base-content">{s.title}</span>
                    </div>
                    <p className="text-xs text-base-content/50 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Telegram API link callout */}
            <a
              href="https://my.telegram.org/apps"
              target="_blank"
              rel="noreferrer"
              className="mt-8 flex items-center gap-3 bg-base-200 hover:bg-base-300 transition-colors rounded-xl px-4 py-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <ExternalLink size={14} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content">Get your API credentials</p>
                <p className="text-xs text-base-content/40 truncate">my.telegram.org → API Development Tools</p>
              </div>
              <ExternalLink size={13} className="text-base-content/20 group-hover:text-base-content/50 transition-colors" />
            </a>
          </div>

          {/* Right — login card */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body gap-5">
                <div className="flex items-center gap-2">
                  <HardDrive size={18} className="text-primary" />
                  <span className="font-semibold text-base-content">Sign in to TGDrive</span>
                </div>

                {step === "credentials" && (
                  <>
                    <div className="flex items-center gap-2 text-base-content/60">
                      <KeyRound size={14} />
                      <span className="text-xs font-medium">Step 1 of 3 — API Credentials</span>
                    </div>
                    <label className="form-control">
                      <div className="label"><span className="label-text">API ID</span></div>
                      <input type="number" className="input input-bordered" placeholder="12345678"
                        value={apiId} onChange={(e) => setApiId(e.target.value)} />
                    </label>
                    <label className="form-control">
                      <div className="label"><span className="label-text">API Hash</span></div>
                      <input type="text" className="input input-bordered font-mono text-sm" placeholder="a1b2c3d4e5f6..."
                        value={apiHash} onChange={(e) => setApiHash(e.target.value)} />
                    </label>
                    {error && <div className="alert alert-error text-sm py-2">{error}</div>}
                    <button className="btn btn-primary" onClick={handleCredentials}>Continue</button>
                    <p className="text-xs text-base-content/30 text-center -mt-2">
                      Stored only in your browser's IndexedDB
                    </p>
                  </>
                )}

                {step === "phone" && (
                  <>
                    <div className="flex items-center gap-2 text-base-content/60">
                      <Phone size={14} />
                      <span className="text-xs font-medium">Step 2 of 3 — Phone Number</span>
                    </div>
                    <label className="form-control">
                      <div className="label"><span className="label-text">Phone with country code</span></div>
                      <input type="tel" className="input input-bordered" placeholder="+91 98765 43210"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePhone()} />
                    </label>
                    {error && <div className="alert alert-error text-sm py-2">{error}</div>}
                    <div className="flex gap-2">
                      <button className="btn btn-ghost flex-1" onClick={() => setStep("credentials")}>Back</button>
                      <button className="btn btn-primary flex-1" onClick={handlePhone} disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-sm" /> : "Send Code"}
                      </button>
                    </div>
                  </>
                )}

                {step === "otp" && (
                  <>
                    <div className="flex items-center gap-2 text-base-content/60">
                      <ShieldCheck size={14} />
                      <span className="text-xs font-medium">Step 3 of 3 — Verification</span>
                    </div>
                    <p className="text-xs text-base-content/40 -mt-3">
                      Check your Telegram app for the code sent to{" "}
                      <span className="font-medium text-base-content/60">{phone}</span>
                    </p>
                    <label className="form-control">
                      <div className="label"><span className="label-text">Code</span></div>
                      <input type="text" className="input input-bordered tracking-widest text-center text-lg font-mono"
                        placeholder="· · · · ·" maxLength={6} value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleOtp()} autoFocus />
                    </label>
                    {error && <div className="alert alert-error text-sm py-2">{error}</div>}
                    <div className="flex gap-2">
                      <button className="btn btn-ghost flex-1" onClick={() => setStep("phone")}>Back</button>
                      <button className="btn btn-primary flex-1" onClick={handleOtp} disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign In"}
                      </button>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Privacy note under card */}
            <div className="mt-3 flex items-start gap-2 px-1">
              <Lock size={12} className="text-base-content/25 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-base-content/30 leading-relaxed">
                TGDrive has no backend. Your API credentials, session token, and file metadata are stored exclusively in your browser and never transmitted to any TGDrive server.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="border-t border-base-300 bg-base-200/50">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h2 className="text-lg font-bold text-base-content mb-6 text-center">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-base-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-base-content">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={15} className="text-base-content/40 flex-shrink-0" />
                    : <ChevronDown size={15} className="text-base-content/40 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-base-content/50 leading-relaxed border-t border-base-300 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adsterra Native Banner */}
      <AdsterraBanner className="border-t border-base-300" />

      {/* ── Footer ── */}
      <div className="border-t border-base-300 bg-base-200">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/30">
          <div className="flex items-center gap-2">
            <HardDrive size={14} className="text-primary/50" />
            <span>TGDrive — built by <span className="text-base-content/50 font-medium">Fenil</span> · {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/about" className="hover:text-base-content/60 transition-colors">About</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-base-content/60 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:text-base-content/60 transition-colors">Terms of Service</a>
            <span>·</span>
            <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="hover:text-base-content/60 transition-colors flex items-center gap-1">
              Telegram API <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}