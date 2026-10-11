import { useEffect, useRef } from "react";
import { useStoreValue } from "../routes/dashboard/store";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdGaugeConfig } from "../models/sd-gauge";

interface SdGaugeProps extends SdComponentProps<unknown, SdGaugeConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdGaugeConfig = { source: "sin", min: -1, max: 1 };

const SdGauge = (props: SdGaugeProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const min = settings.min ?? -1;
  const max = settings.max ?? 1;
  const source = settings.source ?? "sin";
  const raw = useStoreValue(source as any) as number;
  const clamped = Math.max(min, Math.min(max, raw));
  const percent = Math.max(0, Math.min(1, (max - min) === 0 ? 0 : (clamped - min) / (max - min)));
  const display = Math.round(percent * 100);
  const hue = percent * 120;
  const color = `hsl(${hue}, 80%, 50%)`;

  return (
    <div {...rest} className={["sd-gauge", "Gauge", className].filter(Boolean).join(" ")}>
      {settings.title && <h2 className="mb-2 font-semibold">{settings.title}</h2>}
      <svg viewBox="0 0 110 110" width="150px">
        <circle r="50" cx="55" cy="55" stroke="var(--border-strong)" strokeWidth="10" fill="none" strokeDasharray="270 90" strokeDashoffset="0" pathLength="360" strokeLinecap="round" transform="rotate(135 55 55)" />
        <circle r="50" cx="55" cy="55" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${270 * percent} ${360 - 270 * percent}`} strokeDashoffset="0" strokeLinecap="round" pathLength="360" transform="rotate(135 55 55)" />
        <text x="55" y="55" textAnchor="middle" alignmentBaseline="middle" stroke={color}>{display}%</text>
      </svg>
      {children}
    </div>
  );
};

export default SdGauge;
