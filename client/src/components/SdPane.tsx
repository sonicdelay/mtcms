import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdPaneProps extends SdComponentProps<unknown> {
  [key: string]: unknown;
}

const SdPane = (props: SdPaneProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  return (
    <div {...rest} className={["sd-pane", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
};

export default SdPane;
