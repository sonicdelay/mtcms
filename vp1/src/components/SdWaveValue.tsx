import { useStoreValue } from "../store";
import type { DeepKeys, WaveState } from "../store";

interface WaveValueProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WaveValue(props: WaveValueProps) {
  const { className, source = "sin", children, ...rest } = props;
  const value = useStoreValue(source);

  return (
    <div className={className} {...rest}>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      {children}
    </div>
  );
}
