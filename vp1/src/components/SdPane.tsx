import React from "react";
import type { SdProps } from "../types";

interface SdPaneProps extends SdProps {
  data?: string;
  children?: React.ReactNode;
  eventIn?: (payload?: unknown) => void;
  className?: string;
  [key: string]: any;
}

const SdPane = (props: SdPaneProps) => {
  const { data, className, children, eventIn, ...rest } = props;
  const paneClassName = ["Pane", className].join(" ");

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    eventIn?.(event);
    if (typeof rest.onClick === "function") {
      rest.onClick(event);
    }
  };

  return (
    <div className={paneClassName} {...rest} onClick={handleClick}>
      {data && <h2>{data}</h2>}
      {children}
    </div>
  );
};

export default SdPane;
