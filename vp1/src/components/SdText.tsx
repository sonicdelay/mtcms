import React from "react";

interface TextProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const Text = (props: TextProps) => {
  const { className, children, ...rest } = props;
  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
};

export default Text;