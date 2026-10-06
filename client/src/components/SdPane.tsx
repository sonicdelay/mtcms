import { type MouseEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

interface SdPaneProps extends ComponentProps<string> {
  value?: string;
  [key: string]: unknown;
}

const SdPane = (props: SdPaneProps) => {
  const { value, className, children, eventIn, onEvent, ...rest } = props;
  const paneClassName = ["Pane", className].join(" ");

  // Inbound channel: each distinct eventIn is handled once, dispatched to the
  // global action handler and forwarded to onEvent.
  const lastEvent = useRef<ComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onEvent?.(eventIn);
  }, [eventIn, onEvent]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (typeof rest.onClick === "function") rest.onClick(event);
    onEvent?.({ type: "click", payload: { value } });
  };

  return (
    <div className={paneClassName} {...rest} onClick={handleClick}>
      {value && <h2>{value}</h2>}
      {children}
    </div>
  );
};

export default SdPane;
