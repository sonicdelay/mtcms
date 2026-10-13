import { useEffect, useRef } from "react";
import { useStoreValue } from "../routes/dashboard/store";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdWaveConfig } from "../models/sd-wave";

interface SdWaveProps extends SdComponentProps<unknown, SdWaveConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdWaveConfig = { source: "sin" };

const SdWave = (props: SdWaveProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const source = settings.source ?? "sin";
  const storeValue = useStoreValue(source as any) as number;
  const val = typeof storeValue === "number" ? storeValue : 0;
  const normalized = (val + 1) / 2;
  const hue = normalized * 120;

  return (
    <div {...rest} className={["sd-wave", "Wave", className].filter(Boolean).join(" ")}>
      {settings.title && <h2 className="mb-2 font-semibold">{settings.title}</h2>}
      <div className="font-mono text-4xl font-bold" style={{ color: `hsl(${hue}, 90%, 45%)` }}>
        {val.toFixed(4)}
      </div>
      <svg viewBox="0 0 200 60" className="mt-2 w-full" style={{ maxWidth: 300 }}>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ccc" strokeWidth="0.5" />
        <circle cx={normalized * 200} cy={30 - val * 25} r="6" fill={`hsl(${hue}, 90%, 45%)`} />
      </svg>
      {children}
    </div>
  );
};

export default SdWave;
