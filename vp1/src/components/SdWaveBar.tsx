import { useStoreValue } from "../../../client/src/routes/dashboard/store";
import type {
  DeepKeys,
  WaveState,
} from "../../../client/src/routes/dashboard/store";
import type { ComponentProps } from "../models/component-props";

interface WaveBarProps extends ComponentProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  [key: string]: unknown;
}

const WaveBar = (props: WaveBarProps) => {
  const { title, className, source = "sin", children, ...rest } = props;
  const value = useStoreValue(source) as number;

  const barWidth = ((value + 1) / 2) * 100;
  const hue = ((value + 1) / 2) * 360;

  return (
    <div className={className} {...rest}>
      {title && <h2 className="mb-2 font-semibold">{title}</h2>}
      <div className="p-2 font-mono text-xs overflow-hidden">
        <div
          style={{
            width: `${barWidth}%`,
            height: 8,
            backgroundColor: `hsl(${hue}, 80%, 50%)`,
            borderRadius: 4,
            transition: "width 100ms linear",
          }}
        />
        <p className="mt-1 opacity-70">
          {source} = {value.toFixed(4)}
        </p>
      </div>
      {children}
    </div>
  );
};

export default WaveBar;
