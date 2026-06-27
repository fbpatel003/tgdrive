import { useState, useRef, useEffect } from "react";
import { Search, Folder, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchAll } from "../lib/drive";
import type { SearchResult } from "../lib/drive";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const res = await searchAll(query);
      setResults(res);
      setOpen(true);
      setLoading(false);
    }, 300);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (r: SearchResult) => {
    setQuery("");
    setOpen(false);
    if (r.type === "folder" && r.folder) {
      navigate(`/drive/${r.folder.id}`);
    } else if (r.type === "file" && r.folderId) {
      navigate(`/drive/${r.folderId}`);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none" />
        <input
          type="text"
          className="input input-sm input-bordered w-full pl-8 pr-8 bg-base-100"
          placeholder="Search files and folders…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content/60"
            onClick={() => { setQuery(""); setOpen(false); }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-base-200 border border-base-300 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-xs text-base-content/40 flex items-center gap-2">
              <span className="loading loading-spinner loading-xs" /> Searching…
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-base-content/40">No results for "{query}"</div>
          )}

          {!loading && results.length > 0 && (
            <ul>
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-base-300 transition-colors text-left"
                    onClick={() => handleSelect(r)}
                  >
                    {r.type === "folder"
                      ? <Folder size={15} className="text-warning flex-shrink-0" />
                      : <FileText size={15} className="text-base-content/40 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {r.type === "folder" ? r.folder!.title : r.file!.name}
                      </p>
                      {r.type === "file" && (
                        <p className="text-xs text-base-content/40">in folder</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}