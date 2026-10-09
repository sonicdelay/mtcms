import { useStoreValue } from "../routes/dashboard/store";
import type { DeepKeys, WaveState } from "../routes/dashboard/store";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdGaugeProps extends SdComponentProps {
  title?: string;
  source?: DeepKeys<WaveState>;
  min?: number;
  max?: number;
  [key: string]: unknown;
}

const SdGauge = (props: SdGaugeProps) => {
  const {
    title,
    className,
    source = "sin",
    min = -1,
    max = 1,
    value,
    config,
    eventIn,
    onChange,
    ...rest
  } = props;

  const raw = useStoreValue(source) as number;
  const clamped = Math.max(min, Math.min(max, raw));

  const percent = Math.max(0, Math.min(1, (clamped - min) / (max - min)));
  const display = Math.round(percent * 100);

  const hue = percent * 120;
  const color = `hsl(${hue}, 80%, 50%)`;

  const gaugeClassName = ["Gauge", className].filter(Boolean).join(" ");

  return (
    <div className={gaugeClassName} {...rest}>
      {title && <h2 className="mb-2 font-semibold">{title}</h2>}
      <svg viewBox="0 0 110 110" width="150px">
        <circle
          r="50"
          cx="55"
          cy="55"
          stroke="var(--border-strong)"
          strokeWidth="10"
          fill="none"
          strokeDasharray="270 90"
          strokeDashoffset="0"
          pathLength="360"
          strokeLinecap="round"
          transform="rotate(135 55 55)"
        />
        <circle
          r="50"
          cx="55"
          cy="55"
          fill="none"
          stroke={`${color}`}
          strokeWidth="10"
          strokeDasharray={`${270 * percent} ${360 - (270 * percent)}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          pathLength="360"
          transform="rotate(135 55 55)"
          id="knobinsidering"
        />
        <text
          x="55"
          y="55"
          textAnchor="middle"
          alignmentBaseline="middle"
          stroke={`${color}`}
          id="knobval"
        >
          {display}%
        </text>
      </svg>
    </div>
  );
};

export default SdGauge;
