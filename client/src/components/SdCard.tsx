import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdCardProps extends SdComponentProps<unknown> {
  [key: string]: unknown;
}

const SdCard = (props: SdCardProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } =
    props;
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  return (
    <div {...rest} className={["sd-card", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
};

export default SdCard;
