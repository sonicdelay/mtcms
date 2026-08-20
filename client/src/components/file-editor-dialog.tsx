import { useState } from "react";
import { IxButton, IxIconButton, showToast } from "@siemens/ix-react";
import { iconSaveAll, iconClose } from "@siemens/ix-icons/icons";
import { useAppStore } from "../../lib/app.store";
import { writeMediaFile } from "../../lib/admin.api";

interface FileEditorDialogProps {
  path: string;
  name: string;
  initialContent: string;
  onSaved?: () => void;
}

export default function FileEditorDialog({
  path,
  name,
  initialContent,
  onSaved,
}: FileEditorDialogProps) {
  const token = useAppStore((s) => s.token);
  const closeModal = useAppStore((s) => s.closeModal);
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = content !== initialContent;

  const save = async () => {
    if (!token || !dirty) return;
    setBusy(true);
    try {
      await writeMediaFile(token, path, content);
      onSaved?.();
      closeModal();
      showToast({ title: "File saved", type: "success" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-4 pr-10">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {name}
          </div>
          <div className="truncate text-sm opacity-70">{path}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IxButton
            icon={iconSaveAll}
            disabled={!dirty || busy}
            onClick={() => void save()}
          >
            Save
          </IxButton>
          <IxIconButton icon={iconClose} title="Close" onClick={closeModal} />
        </div>
      </div>
      {error && (
        <p style={{ color: "var(--theme-color-alarm-text)" }}>{error}</p>
      )}
      <textarea
        aria-label={`Content of ${name}`}
        spellCheck={false}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="w-full min-h-0 flex-1 resize-none rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
    </div>
  );
}