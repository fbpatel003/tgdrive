<div align="center">

<img src="public/favicon.svg" width="80" height="80" alt="TGDrive Logo" />

# TGDrive

**Unlimited cloud storage — powered by your Telegram account**

[![Deploy](https://github.com/fbpatel003/tgdrive/actions/workflows/deploy.yml/badge.svg)](https://github.com/fbpatel003/tgdrive/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-fbpatel003.github.io%2Ftgdrive-blue)](https://fbpatel003.github.io/tgdrive/)
![License](https://img.shields.io/badge/license-MIT-green)
![Tech](https://img.shields.io/badge/stack-React%20%2B%20GramJS%20%2B%20Vite-blueviolet)

[Live Demo](https://fbpatel003.github.io/tgdrive/) · [Report Bug](https://github.com/fbpatel003/tgdrive/issues) · [Request Feature](https://github.com/fbpatel003/tgdrive/issues)

</div>

---

## 📸 Screenshots

> _Add your screenshots here_

| Login | Drive |
|-------|-------|
| <img width="1891" height="857" alt="image" src="https://github.com/user-attachments/assets/867ffd95-0bf2-4d53-8416-e60b01fce3a7" /> | <img width="1907" height="827" alt="image" src="https://github.com/user-attachments/assets/04a15f88-d927-4fb2-88e3-07d92447acd0" /> |

| Upload | Preview |
|--------|---------|
| ![Upload]() | ![Preview]() |

---

## ✨ What is TGDrive?

TGDrive turns your Telegram account into unlimited cloud storage — directly in your browser. No server, no subscription, no storage limit. Files are stored permanently on Telegram's infrastructure using the official MTProto API.

- **Zero backend** — your browser connects directly to Telegram's servers
- **Zero cost** — completely free, no server to host
- **Unlimited storage** — Telegram has no quota on user accounts
- **Up to 2 GB per file** — Telegram's per-file limit (vs 15 GB for Google Drive)
- **Your data, your device** — credentials and session live only in your browser's IndexedDB

---

## 🚀 Features

- 📁 **Folder organisation** — folders map to private Telegram channels tagged `[TGDrive]`
- 📤 **File upload** — drag and drop, multi-file, real-time progress bar
- 📥 **File download** — direct download with original filename preserved
- 🖼️ **Image preview** — inline preview without downloading
- 🎬 **Video streaming** — MediaSource API streaming, plays while downloading
- 🔐 **Secure login** — 3-step flow: API credentials → phone → OTP
- 💾 **Persistent session** — stays logged in across refreshes via IndexedDB
- 🌙 **Night theme** — DaisyUI night theme, clean minimal UI
- 📱 **Responsive** — works on desktop and mobile browsers

---

## 🛠️ How It Works

```
Your Browser
├── React UI
├── GramJS (MTProto client — same protocol as official Telegram app)
├── IndexedDB (session, credentials, file metadata cache)
└── Direct WebSocket ──► Telegram MTProto servers
                              └── Your files stored here permanently
```

Folders are **private Telegram channels** prefixed with `[TGDrive]`. Files are sent as document attachments with a JSON caption carrying the original filename, size, MIME type, and upload timestamp — so metadata is always accurate regardless of how Telegram processes the file.

---

## ⚡ Getting Started

### Prerequisites

- A Telegram account
- API credentials from [my.telegram.org](https://my.telegram.org)

### Get Your API Credentials

1. Go to [my.telegram.org](https://my.telegram.org) and log in
2. Click **API Development Tools**
3. Create a new application (name and platform don't matter)
4. Copy your **API ID** (a number) and **API Hash** (a hex string)

### Use the Live Version

Just visit **[fbpatel003.github.io/tgdrive](https://fbpatel003.github.io/tgdrive/)** — no installation needed.

### Run Locally

```bash
# Clone the repo
git clone https://github.com/fbpatel003/tgdrive.git
cd tgdrive

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), enter your API credentials, and sign in.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 8 |
| Telegram Client | GramJS (MTProto) |
| Local Storage | Dexie.js (IndexedDB) |
| Styling | Tailwind CSS + DaisyUI (night theme) |
| Icons | Lucide React |
| Routing | React Router v6 |
| Server State | TanStack Query |
| Deployment | GitHub Pages + GitHub Actions |

---

## 📁 Project Structure

```
tgdrive/
├── public/
│   ├── favicon.svg          # SVG favicon
│   ├── favicon.ico          # ICO favicon (16×16, 32×32)
│   ├── favicon-192.png      # Apple touch icon
│   └── 404.html             # GitHub Pages SPA redirect
├── src/
│   ├── lib/
│   │   ├── db.ts            # Dexie IndexedDB schema
│   │   ├── telegram.ts      # GramJS client singleton + PersistentSession
│   │   ├── drive.ts         # All drive operations (folders, files, upload, download)
│   │   └── streamVideo.ts   # MediaSource API video streaming
│   ├── hooks/
│   │   └── useAuth.tsx      # Auth state context
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── UploadModal.tsx   # Drag-drop upload with progress
│   │   ├── NewFolderModal.tsx
│   │   ├── PreviewModal.tsx  # Image + streaming video preview
│   │   └── AdBanner.tsx      # Google AdSense banner
│   ├── pages/
│   │   ├── LoginPage.tsx    # Landing page + 3-step login flow
│   │   └── DrivePage.tsx    # Folder grid + file table
│   └── App.tsx              # Router with auth guard
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions → GitHub Pages
├── vite.config.ts
└── index.html
```

---

## 🔒 Privacy & Security

| Concern | How TGDrive handles it |
|---------|----------------------|
| API credentials | Stored only in your browser's IndexedDB. Never transmitted to any TGDrive server (there is none). |
| Telegram session | Stored in IndexedDB. Automatically kept in sync with Telegram's auth key to prevent session errors. |
| File data | Goes directly from your browser to Telegram's servers via WebSocket. Never touches a TGDrive server. |
| Who can see your files | Only you. Folders are private Telegram channels on your account. |
| If you clear browser data | Session lost, files safe. Log in again and everything reappears. |

> TGDrive has no backend server. The author never sees your credentials, session, or files.

---

## ⚠️ Limitations & Known Issues

- **2FA accounts** — Two-factor authentication login is not yet supported
- **File size** — Telegram's per-file limit is 2 GB
- **Video codec support** — MediaSource streaming works for `video/mp4` and `video/webm`. Other formats fall back to full download before playback
- **Session on clear** — Clearing browser data (IndexedDB) requires re-login (files remain safe)
- **Telegram ToS** — Using the MTProto API for storage automation is a grey area. Accounts used heavily for automated uploads could theoretically be flagged

---

## 🚢 Deployment

The repo includes a GitHub Actions workflow that builds and deploys automatically on every push to `main`.

### Deploy Your Own Fork

1. Fork this repo
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Push any change to `main` — the workflow runs automatically
4. Your site will be live at `https://yourusername.github.io/tgdrive/`

The base path is detected automatically from `GITHUB_REPOSITORY` — no config needed.

---

## 🤝 Contributing

Contributions are welcome. Open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature
git commit -m "add: your feature"
git push origin feature/your-feature
# open a Pull Request
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [GramJS](https://github.com/gram-js/gramjs) — MTProto client in JavaScript
- [Telegram API](https://core.telegram.org/api) — the underlying infrastructure
- [DaisyUI](https://daisyui.com) — component library
- Inspired by [Telegram-Drive](https://github.com/caamer20/Telegram-Drive)

---

<div align="center">

Built by [Fenil](https://github.com/fbpatel003) · Star ⭐ if you find it useful

</div>
