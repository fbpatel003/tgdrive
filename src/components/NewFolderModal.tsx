import { useState } from "react";
import { FolderPlus, X } from "lucide-react";
import { createFolder } from "../lib/drive";

interface Props {
  onDone: () => void;
  onClose: () => void;
}

export default function NewFolderModal({ onDone, onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter a folder name.");
    setLoading(true);
    setError("");
    try {
      await createFolder(name.trim());
      onDone();
    } catch (e: any) {
      setError(e.message ?? "Failed to create folder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FolderPlus size={18} /> New Folder
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Folder name"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        {error && <p className="text-error text-sm mt-2">{error}</p>}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Create"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
