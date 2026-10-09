import { useStoreValue } from "../routes/dashboard/store";
import type { DeepKeys, WaveState } from "../routes/dashboard/store";
import type { SdComponentProps } from "../models/sd-component-props";

interface WaveValueProps extends SdComponentProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  [key: string]: unknown;
}

const WaveValue = (props: WaveValueProps) => {
  const {
    className,
    source = "sin",
    children,
    value: _value,
    config,
    eventIn,
    onChange,
    ...rest
  } = props;
  const value = useStoreValue(source);

  return (
    <div className={className} {...rest}>
      <pre>{JSON.stringify(value, null, 2)}</pre>
      {children}
    </div>
  );
};

export default WaveValue;
