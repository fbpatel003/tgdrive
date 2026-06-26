import { useEffect, useRef, useState } from "react";
import { X, Download, Loader2, AlertTriangle } from "lucide-react";
import { previewFile } from "../lib/drive";
import { streamVideoToMediaSource } from "../lib/streamVideo";
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
  const [streamStatus, setStreamStatus] = useState("");

  const stopRef = useRef<(() => void) | null>(null);
  const urlRef = useRef<string | null>(null);

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setStreamStatus("");

      try {
        if (isImage) {
          // Images: full download into blob URL (images are small enough)
          const blobUrl = await previewFile(file);
          if (!cancelled) {
            urlRef.current = blobUrl;
            setUrl(blobUrl);
            setLoading(false);
          } else {
            URL.revokeObjectURL(blobUrl);
          }
        } else if (isVideo) {
          // Videos: MediaSource streaming — starts playing after first chunk
          setStreamStatus("Connecting to Telegram…");
          const { url: streamUrl, stop } = await streamVideoToMediaSource(
            file,
            (msg) => { if (!cancelled) setError(msg); }
          );
          if (!cancelled) {
            stopRef.current = stop;
            urlRef.current = streamUrl;
            setUrl(streamUrl);
            setLoading(false);
            setStreamStatus("Streaming…");
          } else {
            stop();
            URL.revokeObjectURL(streamUrl);
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Preview failed");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      // Stop streaming
      if (stopRef.current) { stopRef.current(); stopRef.current = null; }
      // Revoke blob URL
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    };
  }, [file]);

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-300">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-base-200 border-b border-base-300">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{file.name}</span>
            {isVideo && url && !error && (
              <span className="badge badge-success badge-xs gap-1 flex-shrink-0">
                ● {streamStatus}
              </span>
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

          {/* Loading state */}
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-base-content/50">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span className="text-sm">{streamStatus || "Loading…"}</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="py-16 px-8 text-center flex flex-col items-center gap-3">
              <AlertTriangle size={28} className="text-warning" />
              <p className="text-sm text-base-content/60">{error}</p>
              <button className="btn btn-sm btn-primary gap-2" onClick={onDownload}>
                <Download size={13} /> Download instead
              </button>
            </div>
          )}

          {/* Image */}
          {url && isImage && (
            <img
              src={url}
              alt={file.name}
              className="max-w-full max-h-[80vh] object-contain"
            />
          )}

          {/* Video — src set as soon as MediaSource URL is ready,
              video starts buffering immediately, plays once enough data in */}
          {url && isVideo && (
            <video
              key={url}
              src={url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] w-full"
              onCanPlay={() => setStreamStatus("Streaming…")}
              onError={() => setError("Video playback error. Try downloading instead.")}
            />
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}