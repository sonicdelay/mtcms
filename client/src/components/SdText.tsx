import type { SdComponentProps } from "../models/sd-component-props";

interface TextProps extends SdComponentProps {
  title?: string;
  className?: string;
  [key: string]: unknown;
}

const Text = (props: TextProps) => {
  const { className, children, value, config, eventIn, onChange, ...rest } =
    props;
  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
};

export default Text;
