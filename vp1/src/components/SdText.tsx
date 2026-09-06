import React from "react";

interface TextProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

const Text = ({ className, children }: TextProps) => {
    return (
    <>
     <span className={className}>
      {children}
    </span>
    </>
  );
}

export default Text;
