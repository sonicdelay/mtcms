import type { ComponentProps } from "../models/component-props";

interface SdButtonProps extends ComponentProps<string> {
  value?: string;
  [key: string]: unknown;
}

const SdButton = (props: SdButtonProps) => {
  const { value, className, ...rest } = props;
  const buttonClassName = ["Button1", className].join(" ");

  return (
    <div className={buttonClassName} {...rest}>
      <button>{value ?? "Button2"}</button>
    </div>
  );
};

export default SdButton;
export const sdButtonObject = {
  name: "Button",
  tooltip: "Button tooltip to just explain the functionality ...",
};
