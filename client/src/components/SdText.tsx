import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdTextConfig } from "../models/sd-text";

interface SdTextProps extends SdComponentProps<unknown, SdTextConfig> {
  [key: string]: unknown;
}

const SdText = (props: SdTextProps) => {
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
    <span
      {...rest}
      className={["sd-text", className].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
};

export default SdText;
