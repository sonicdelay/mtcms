import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IxContentHeader, IxIconButton, showToast } from "@siemens/ix-react";
import {
  iconChevronRightSmall,
  iconDocument,
  iconFolder,
  iconRefresh,
  iconTrashcan,
  iconUpload,
} from "@siemens/ix-icons/icons";
import { useAppStore } from "../../lib/app.store";
import {
  createMediaDirectory,
  deleteMediaPath,
  listMedia,
  readMediaText,
  uploadMediaFile,
  writeMediaFile,
} from "../../lib/admin.api";
import type { FileItem } from "../../lib/types";
import FileEditorDialog from "../../components/file-editor-dialog";

export default function FilesPage() {
  const token = useAppStore((s) => s.token);
  const openModal = useAppStore((s) => s.openModal);
  const closeModal = useAppStore((s) => s.closeModal);
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [resizing, setResizing] = useState(false);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const containerLeft = container.getBoundingClientRect().left;
    const containerWidth = container.getBoundingClientRect().width;
    setResizing(true);
    const onMove = (moveEvent: PointerEvent) => {
      const next = Math.min(
        Math.max(moveEvent.clientX - containerLeft, 160),
        Math.max(containerWidth - 320, 160),
      );
      setSidebarWidth(next);
    };
    const onUp = () => {
      setResizing(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const run = async () => {
      try {
        const rows = await listMedia(token, currentPath);
        if (cancelled) return;
        setItems(
          rows
            .filter(
              (item) => item && (item.type === "dir" || item.type === "file"),
            )
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
              return a.name.localeCompare(b.name);
            }),
        );
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, currentPath, reloadKey]);

  const directories = useMemo(
    () => items.filter((i) => i.type === "dir"),
    [items],
  );
  const files = useMemo(() => items.filter((i) => i.type === "file"), [items]);

  const segments = useMemo(
    () => currentPath.split("/").filter(Boolean),
    [currentPath],
  );

  const refresh = () => setReloadKey((k) => k + 1);

  const navigateTo = (path: string) => {
    setCurrentPath(path.replace(/^\/+/, "").replace(/\/+$/, ""));
  };

  const createDir = async () => {
    if (!token) return;
    const name = globalThis.prompt("Name for the new folder:");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const path = currentPath ? `${currentPath}/${name.trim()}` : name.trim();
      await createMediaDirectory(token, path);
      refresh();
      showToast({ title: "Directory created", type: "success" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const createFile = async () => {
    if (!token) return;
    const name = globalThis.prompt("Name for the new file:");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const path = currentPath ? `${currentPath}/${name.trim()}` : name.trim();
      await writeMediaFile(token, path, "");
      refresh();
      showToast({ title: "File created", type: "success" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!token || !files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = currentPath ? `${currentPath}/${file.name}` : file.name;
        await uploadMediaFile(token, path, file);
      }
      refresh();
      showToast({
        title: `${files.length} file${files.length > 1 ? "s" : ""} uploaded`,
        type: "success",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
      setBusy(false);
    }
  };

  const openFileContent = async (item: FileItem) => {
    if (!token) return;
    setBusy(true);
    try {
      const content = await readMediaText(token, item.path);
      setError(null);
      openModal(
        <FileEditorDialog
          path={item.path}
          name={item.name}
          initialContent={content}
          onSaved={refresh}
        />,
        "file-editor",
        "wide",
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item: FileItem) => {
    if (!token) return;
    if (!window.confirm(`Delete "${item.path}"?`)) return;
    setBusy(true);
    try {
      await deleteMediaPath(token, item.path);
      closeModal();
      refresh();
      showToast({ title: "Deleted", type: "info" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page admin-page--files">
      <IxContentHeader
        headerTitle="Files"
        headerSubtitle={`media / ${segments.join(" / ") || "…"}`}
      />

      <div className="admin-file-manager" ref={containerRef}>
        <div
          className="admin-file-manager__sidebar"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="admin-file-manager__nav">
            {segments.map((segment, index) => (
              <button
                key={`${index}-${segment}`}
                type="button"
                className="admin-file-manager__crumb"
                onClick={() =>
                  navigateTo(segments.slice(0, index + 1).join("/"))}
              >
                {segment}
              </button>
            ))}
            {segments.length > 0 && (
              <button
                type="button"
                className="admin-file-manager__crumb"
                onClick={() => navigateTo("")}
              >
                media root
              </button>
            )}
          </div>
        </div>

        <div
          className={`admin-file-manager__splitter${resizing ? " active" : ""}`}
          onPointerDown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />

        <div className="admin-file-manager__content">
          <div className="admin-page__toolbar">
            <div className="admin-file-manager__breadcrumbs">
              <button
                type="button"
                className="admin-file-manager__crumb"
                onClick={() => navigateTo("")}
              >
                media
              </button>
              {segments.map((segment, index) => (
                <span
                  key={`${index}-${segment}`}
                  className="admin-file-manager__crumb-group"
                >
                  <IxIconButton
                    icon={iconChevronRightSmall}
                    title=""
                    disabled
                    slot="end"
                    size="16"
                  />
                  <button
                    type="button"
                    className="admin-file-manager__crumb"
                    onClick={() =>
                      navigateTo(segments.slice(0, index + 1).join("/"))}
                  >
                    {segment}
                  </button>
                </span>
              ))}
            </div>
            <div className="admin-file-manager__actions">
              <IxIconButton
                icon={iconFolder}
                title="New folder"
                onClick={() => void createDir()}
                disabled={busy}
              />
              <IxIconButton
                icon={iconDocument}
                title="New file"
                onClick={() => void createFile()}
                disabled={busy}
              />
              <IxIconButton
                icon={iconUpload}
                title="Upload files"
                onClick={() => uploadInputRef.current?.click()}
                disabled={busy}
              />
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                hidden
                onChange={(event) => void uploadFiles(event.target.files)}
              />
              <IxIconButton icon={iconRefresh} onClick={refresh} />
            </div>
          </div>

          {error && (
            <p style={{ color: "var(--theme-color-alarm-text)" }}>{error}</p>
          )}

          <div className="admin-file-list">
            {directories.map((item) => (
              <div key={item.path} className="admin-row">
                <IxIconButton
                  icon={iconFolder}
                  title="Directory"
                  disabled
                  slot="start"
                />
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo(item.path);
                  }}
                  className="admin-row__main"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="admin-row__title">{item.name}</div>
                  <div className="admin-row__meta">{item.path}</div>
                </a>
                <IxIconButton
                  icon={iconTrashcan}
                  title="Delete"
                  onClick={() =>
                    removeItem(item)}
                />
              </div>
            ))}
            {files.map((item) => (
              <div key={item.path} className="admin-row">
                <IxIconButton
                  icon={iconDocument}
                  title="File"
                  disabled
                  slot="start"
                />
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    openFileContent(item);
                  }}
                  className="admin-row__main"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="admin-row__title">{item.name}</div>
                  <div className="admin-row__meta">{item.path}</div>
                </a>
                <a
                  href={`/api/fm/${
                    item.path.split("/").map(encodeURIComponent).join("/")
                  }?token=${encodeURIComponent(token ?? "")}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Open raw"
                  style={{ color: "inherit" }}
                >
                  <IxIconButton icon={iconUpload} title="Open raw" />
                </a>
                <IxIconButton
                  icon={iconTrashcan}
                  title="Delete"
                  onClick={() => removeItem(item)}
                />
              </div>
            ))}
            {items.length === 0 && (
              <p style={{ opacity: 0.7 }}>No files or folders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
