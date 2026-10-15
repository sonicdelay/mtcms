import { useEffect, useRef } from "react";
import { useStoreValue } from "../routes/dashboard/store";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdWaveBarConfig } from "../models/sd-wave";

interface SdWaveBarProps extends SdComponentProps<unknown, SdWaveBarConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdWaveBarConfig = { source: "sin" };

const SdWaveBar = (props: SdWaveBarProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } =
    props;
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
  const hue = ((v + 1) / 2) * 120;

  return (
    <div
      {...rest}
      className={["sd-wavebar", "WaveBar", className].filter(Boolean).join(" ")}
    >
      {settings.title && (
        <h2 className="mb-2 font-semibold">{settings.title}</h2>
      )}
      <div className="h-4 w-full rounded bg-gray-200">
        <div
          className="h-4 rounded"
          style={{
            width: `${((v + 1) / 2) * 100}%`,
            backgroundColor: `hsl(${hue}, 90%, 45%)`
          }}
        />
      </div>
      {children}
    </div>
  );
};

export default SdWaveBar;
