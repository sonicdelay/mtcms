import { useStoreValue } from "../../../client/src/routes/dashboard/store";
import type {
  DeepKeys,
  WaveState,
} from "../../../client/src/routes/dashboard/store";
import type { ComponentProps } from "../models/component-props";

interface WaveValueProps extends ComponentProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  [key: string]: unknown;
}

const WaveValue = (props: WaveValueProps) => {
  const { className, source = "sin", children, ...rest } = props;
  const value = useStoreValue(source);

  return (
    <div className={className} {...rest}>
      <pre>{JSON.stringify(value, null, 2)}</pre>
      {children}
    </div>
  );
};

export default WaveValue;
