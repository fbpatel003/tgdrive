import { useEffect, useRef, useState } from "react";
import { X, Download, Loader2, AlertTriangle } from "lucide-react";
import { previewFile } from "../lib/drive";
import { streamVideo } from "../lib/streamVideo";
import type { CachedFile } from "../lib/db";

interface Props {
  file: CachedFile;
  onClose: () => void;
  onDownload: () => void;
}

export default function PreviewModal({ file, onClose, onDownload }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const prevUrlsRef = useRef<string[]>([]);

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");

  useEffect(() => {
    const abort = new AbortController();
    abortRef.current = abort;

    async function load() {
      setLoading(true);
      setError("");
      setProgress(0);

      try {
        if (isImage) {
          const blobUrl = await previewFile(file);
          if (!abort.signal.aborted) {
            setUrl(blobUrl);
            prevUrlsRef.current.push(blobUrl);
            setLoading(false);
          } else {
            URL.revokeObjectURL(blobUrl);
          }
        } else if (isVideo) {
          await streamVideo(
            file,
            (pct) => {
              if (!abort.signal.aborted) {
                setProgress(pct);
                if (pct > 0.01) setLoading(false);
              }
            },
            (newUrl) => {
              if (!abort.signal.aborted) {
                setUrl(newUrl);
                prevUrlsRef.current.push(newUrl);
                setLoading(false);
              } else {
                URL.revokeObjectURL(newUrl);
              }
            },
            abort.signal
          );
        }
      } catch (e: unknown) {
        if (!abort.signal.aborted) {
          setError(e instanceof Error ? e.message : "Preview failed");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      abort.abort();
      // Revoke all blob URLs created during this session
      prevUrlsRef.current.forEach(URL.revokeObjectURL);
      prevUrlsRef.current = [];
    };
  }, [file]);

  const pct = Math.round(progress * 100);

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-300">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-base-200 border-b border-base-300">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{file.name}</span>
            {isVideo && !loading && progress < 1 && (
              <span className="badge badge-info badge-xs flex-shrink-0">
                {pct}% buffered
              </span>
            )}
            {isVideo && progress >= 1 && (
              <span className="badge badge-success badge-xs flex-shrink-0">fully loaded</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="btn btn-ghost btn-xs gap-1.5" onClick={onDownload}>
              <Download size={13} /> Download
            </button>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex items-center justify-center min-h-64 max-h-[80vh] bg-black/50 relative">

          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-base-content/50">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span className="text-sm">
                {isVideo ? "Buffering…" : "Loading…"}
              </span>
            </div>
          )}

          {/* Video progress bar overlay while loading */}
          {isVideo && progress > 0 && progress < 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-base-300/50">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {error && (
            <div className="py-16 px-8 text-center flex flex-col items-center gap-3">
              <AlertTriangle size={28} className="text-warning" />
              <p className="text-sm text-base-content/60">{error}</p>
              <button className="btn btn-sm btn-primary gap-2" onClick={onDownload}>
                <Download size={13} /> Download instead
              </button>
            </div>
          )}

          {url && isImage && (
            <img src={url} alt={file.name} className="max-w-full max-h-[80vh] object-contain" />
          )}

          {url && isVideo && (
            <video
              key={url}
              src={url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] w-full"
              onError={() => setError("Playback error. Try downloading instead.")}
            />
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}