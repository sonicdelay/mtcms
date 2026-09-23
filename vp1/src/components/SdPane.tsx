import React from "react";

interface SdPaneProps {
  data?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const SdPane = (props: SdPaneProps) => {
  const { data, className, children, ...rest } = props;
  const paneClassName = ["Pane", className].join(" ");

  return (
    <div className={paneClassName} {...rest}>
      {data && <h2>{data}</h2>}
      {children}
    </div>
  );
};

export default SdPane;