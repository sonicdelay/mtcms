import { useStoreValue } from "../store";
import type { DeepKeys, WaveState } from "../store";

interface WaveValueProps {
  title?: string;
  className?: string;
  source?: DeepKeys<WaveState>;
  children?: React.ReactNode;
}

export default function WaveValue({ className, source = "sin", children }: WaveValueProps) {
  const value = useStoreValue(source);

  return (
    <div className={className}>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      {children}
    </div>
  );
}
