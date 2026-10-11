import { useEffect, useRef, type ChangeEvent } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdTextareaConfig } from "../models/sd-textarea";

interface SdTextareaProps extends SdComponentProps<string, SdTextareaConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdTextareaConfig = {};

const SdTextarea = (props: SdTextareaProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.({ type: "change", payload: { value: event.target.value } });
  };

  return (
    <div className={["sd-textarea-wrapper", className].filter(Boolean).join(" ")}>
      {settings.label && <label className="sd-textarea__label">{settings.label}</label>}
      <textarea
        {...rest}
        value={value ?? ""}
        rows={settings.rows}
        disabled={settings.disabled}
        className="sd-textarea"
        onChange={handleChange}
      />
      {children}
    </div>
  );
};

export default SdTextarea;
