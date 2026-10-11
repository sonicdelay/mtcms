import { useEffect, useRef } from "react";
import { useStoreValue } from "../routes/dashboard/store";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdWaveValueConfig } from "../models/sd-wave";

interface SdWaveValueProps extends SdComponentProps<unknown, SdWaveValueConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdWaveValueConfig = { source: "sin" };

const SdWaveValue = (props: SdWaveValueProps) => {
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
  const val = useStoreValue(source as any) as number;
  const v = typeof val === "number" ? val : 0;

  return (
    <div {...rest} className={["sd-wavevalue", "WaveValue", className].filter(Boolean).join(" ")}>
      {settings.title && <h2 className="mb-2 font-semibold">{settings.title}</h2>}
      <span className="font-mono text-xl">{v.toFixed(4)}</span>
      {children}
    </div>
  );
};

export default SdWaveValue;
