import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Folder, FileText, Image, Video, Music, Archive,
  Upload, FolderPlus, Download, Trash2, ChevronLeft,
  RefreshCw, Loader2, Eye
} from "lucide-react";
import Navbar from "../components/Navbar";
import UploadModal from "../components/UploadModal";
import NewFolderModal from "../components/NewFolderModal";
import PreviewModal from "../components/PreviewModal";
import AdBanner from "../components/AdBanner";
import { getFolders, getFiles, downloadFile, deleteFile, deleteFolder, formatSize } from "../lib/drive";
import type { CachedFile, CachedFolder } from "../lib/db";

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <Image size={16} className="text-info" />;
  if (mime.startsWith("video/")) return <Video size={16} className="text-secondary" />;
  if (mime.startsWith("audio/")) return <Music size={16} className="text-accent" />;
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar"))
    return <Archive size={16} className="text-warning" />;
  return <FileText size={16} className="text-base-content/40" />;
}

export default function DrivePage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();

  const [folders, setFolders] = useState<CachedFolder[]>([]);
  const [files, setFiles] = useState<CachedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewingFile, setPreviewingFile] = useState<CachedFile | null>(null);

  const currentFolder = folders.find((f) => f.id === folderId);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!folderId) {
        const f = await getFolders();
        setFolders(f);
        setFiles([]);
      } else {
        const [f, fi] = await Promise.all([getFolders(), getFiles(folderId)]);
        setFolders(f);
        setFiles(fi);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load.";
      if (msg === "SESSION_EXPIRED" || msg === "NOT_AUTHENTICATED") {
        navigate("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteFile = async (file: CachedFile) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await deleteFile(file);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFolder = async (folder: CachedFolder) => {
    if (!confirm(`Delete folder "${folder.title}" and ALL its files? This cannot be undone.`)) return;
    setDeletingId(folder.id);
    try {
      await deleteFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />

      {/* Ad banner — horizontal leaderboard below nav */}
      <AdBanner
        slot="1234567890"
        format="horizontal"
        className="max-w-5xl w-full mx-auto px-4 pt-3"
      />

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">

        {/* Breadcrumb + Actions */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <button
              className="font-medium text-base-content/60 hover:text-base-content transition-colors"
              onClick={() => navigate("/drive")}
            >
              My Drive
            </button>
            {currentFolder && (
              <>
                <span className="text-base-content/30">/</span>
                <span className="font-medium text-base-content">{currentFolder.title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm gap-1.5" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {!folderId && (
              <button className="btn btn-ghost btn-sm gap-1.5" onClick={() => setShowNewFolder(true)}>
                <FolderPlus size={14} /> New Folder
              </button>
            )}
            {folderId && (
              <button className="btn btn-primary btn-sm gap-1.5" onClick={() => setShowUpload(true)}>
                <Upload size={14} /> Upload
              </button>
            )}
          </div>
        </div>

        {folderId && (
          <button className="btn btn-ghost btn-sm gap-1.5 mb-4" onClick={() => navigate("/drive")}>
            <ChevronLeft size={15} /> Back to folders
          </button>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button className="btn btn-ghost btn-xs" onClick={load}>Retry</button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {/* Root — folder grid */}
        {!loading && !folderId && (
          folders.length === 0 ? (
            <div className="text-center py-20 text-base-content/40">
              <Folder size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No folders yet</p>
              <p className="text-sm mt-1">Create a folder to start uploading files.</p>
              <button className="btn btn-primary btn-sm mt-4 gap-2" onClick={() => setShowNewFolder(true)}>
                <FolderPlus size={14} /> Create Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/drive/${folder.id}`)}
                >
                  <div className="card-body py-4 px-5 flex-row items-center gap-3">
                    <Folder size={22} className="text-warning flex-shrink-0" />
                    <span className="font-medium text-sm flex-1 truncate">{folder.title}</span>
                    <button
                      className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity text-error"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                      disabled={deletingId === folder.id}
                    >
                      {deletingId === folder.id
                        ? <span className="loading loading-spinner loading-xs" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Inside folder — file list */}
        {!loading && folderId && (
          files.length === 0 ? (
            <div className="text-center py-20 text-base-content/40">
              <Upload size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">This folder is empty</p>
              <p className="text-sm mt-1">Upload files to store them on Telegram.</p>
              <button className="btn btn-primary btn-sm mt-4 gap-2" onClick={() => setShowUpload(true)}>
                <Upload size={14} /> Upload Files
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-base-content/50 text-xs border-base-300">
                    <th className="w-8"></th>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Size</th>
                    <th className="hidden md:table-cell">Date</th>
                    <th className="w-20 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-base-200 border-base-300">
                      <td>{fileIcon(file.mimeType)}</td>
                      <td><span className="text-sm truncate max-w-[200px] block">{file.name}</span></td>
                      <td className="hidden sm:table-cell text-xs text-base-content/50">
                        {file.size ? formatSize(file.size) : "—"}
                      </td>
                      <td className="hidden md:table-cell text-xs text-base-content/50">
                        {new Date(file.date).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {(file.mimeType.startsWith("image/") || file.mimeType.startsWith("video/")) && (
                            <button
                              className="btn btn-ghost btn-xs btn-circle"
                              onClick={() => setPreviewingFile(file)}
                              title="Preview"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-xs btn-circle"
                            onClick={() => downloadFile(file)}
                            title="Download"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-circle text-error"
                            onClick={() => handleDeleteFile(file)}
                            disabled={deletingId === file.id}
                            title="Delete"
                          >
                            {deletingId === file.id
                              ? <span className="loading loading-spinner loading-xs" />
                              : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {showUpload && folderId && (
        <UploadModal
          folderId={folderId}
          onDone={() => { setShowUpload(false); load(); }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showNewFolder && (
        <NewFolderModal
          onDone={() => { setShowNewFolder(false); load(); }}
          onClose={() => setShowNewFolder(false)}
        />
      )}

      {previewingFile && (
        <PreviewModal
          file={previewingFile}
          onClose={() => setPreviewingFile(null)}
          onDownload={() => { downloadFile(previewingFile); setPreviewingFile(null); }}
        />
      )}
    </div>
  );
}