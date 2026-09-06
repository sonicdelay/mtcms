import React from "react";

interface SdPaneProps {
  data?: string;
  className?: string;
  children?: React.ReactNode;
}

const SdPane = ({ data, className, children }: SdPaneProps) => {

  const paneClassName = ["Pane", className].filter(Boolean).join(" ");

  return (
    <div className={paneClassName}>
      {data && <h2>{data}</h2>}
      {children}
    </div>
  );
}

export default SdPane;
