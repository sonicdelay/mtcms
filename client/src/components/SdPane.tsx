import { type MouseEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdPaneProps extends SdComponentProps<string> {
  value?: string;
  [key: string]: unknown;
}

const SdPane = (props: SdPaneProps) => {
  const { value, className, children, eventIn, onChange, ...rest } = props;
  const paneClassName = ["Pane", className].join(" ");

  // Inbound channel: each distinct eventIn is handled once, dispatched to the
  // global action handler and forwarded to onChange.
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (typeof rest.onClick === "function") rest.onClick(event);
    onChange?.({ type: "click", payload: { value } });
  };

  return (
    <div className={paneClassName} {...rest} onClick={handleClick}>
      {value && <h2>{value}</h2>}
      {children}
    </div>
  );
};

export default SdPane;
