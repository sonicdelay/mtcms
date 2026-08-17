"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  IxButton,
  IxContentHeader,
  IxIconButton,
  showToast,
} from "@siemens/ix-react";
import {
  iconFolder,
  iconRefresh,
  iconDocument,
  iconTrashcan,
  iconSaveAll,
  iconUpload,
  iconClose,
  iconChevronRightSmall,
} from "@siemens/ix-icons/icons";
import { useAppStore } from "@/lib/app.store";
import {
  createMediaDirectory,
  deleteMediaPath,
  listMedia,
  readMediaText,
  uploadMediaFile,
  writeMediaFile,
  type FileItem,
} from "@/lib/admin.api";

interface OpenFile {
  path: string;
  name: string;
  content: string;
  original: string;
  dirty: boolean;
}

export default function FilesPage() {
  const token = useAppStore((s) => s.token);
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [busy, setBusy] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

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
    setOpenFile(null);
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
      setOpenFile({
        path: item.path,
        name: item.name,
        content,
        original: content,
        dirty: false,
      });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const closeFile = () => setOpenFile(null);

  const saveFile = async () => {
    if (!token || !openFile) return;
    setBusy(true);
    try {
      await writeMediaFile(token, openFile.path, openFile.content);
      setOpenFile((f) => (f ? { ...f, original: f.content, dirty: false } : f));
      refresh();
      showToast({ title: "File saved", type: "success" });
      setError(null);
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
      if (openFile && openFile.path === item.path) setOpenFile(null);
      refresh();
      showToast({ title: "Deleted", type: "info" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onChangeOpenContent = (value: string) => {
    setOpenFile((f) =>
      f ? { ...f, content: value, dirty: value !== f.original } : f,
    );
  };

  return (
    <div className="admin-page">
      <IxContentHeader
        headerTitle="Files"
        headerSubtitle={`media / ${segments.join(" / ") || "…"}`}
      />

      <div className="admin-file-manager">
        <div className="admin-file-manager__sidebar">
          <div className="admin-file-manager__sidebar-actions">
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
          </div>

          <div className="admin-file-manager__nav">
            {segments.map((segment, index) => (
              <button
                key={`${index}-${segment}`}
                type="button"
                className="admin-file-manager__crumb"
                onClick={() =>
                  navigateTo(segments.slice(0, index + 1).join("/"))
                }
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
                      navigateTo(segments.slice(0, index + 1).join("/"))
                    }
                  >
                    {segment}
                  </button>
                </span>
              ))}
            </div>
            <IxIconButton icon={iconRefresh} onClick={refresh} />
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
                  onClick={() => removeItem(item)}
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
                  href={`/api/fm/${item.path.split("/").map(encodeURIComponent).join("/")}`}
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

        {openFile && (
          <div className="admin-file-editor">
            <div className="admin-file-editor__header">
              <div>
                <div className="admin-file-editor__title">{openFile.name}</div>
                <div className="admin-file-editor__path">{openFile.path}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <IxButton
                  icon={iconSaveAll}
                  disabled={!openFile.dirty || busy}
                  onClick={saveFile}
                >
                  Save
                </IxButton>
                <IxIconButton
                  icon={iconClose}
                  title="Close"
                  onClick={closeFile}
                />
              </div>
            </div>
            <textarea
              aria-label={`Content of ${openFile.name}`}
              spellCheck={false}
              value={openFile.content}
              onChange={(event) => onChangeOpenContent(event.target.value)}
              className="admin-file-editor__textarea"
            />
          </div>
        )}
      </div>
    </div>
  );
}
