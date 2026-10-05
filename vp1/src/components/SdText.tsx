import type { ComponentProps } from "../models/component-props";

interface TextProps extends ComponentProps {
  title?: string;
  className?: string;
  [key: string]: unknown;
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