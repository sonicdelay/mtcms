interface SdButtonProps {
  data?: string;
  className?: string;
  [key: string]: any;
}

const SdButton = (props: SdButtonProps) => {
  const { data, className, ...rest } = props;
  const buttonClassName = ["Button1", className].join(" ");

  return (
    <div className={buttonClassName} {...rest}>
      <button>{data ?? "Button2"}</button>
    </div>
  );
};

export default SdButton;
export const sdButtonObject = {
  name: "Button",
  tooltip: "Button tooltip to just explain the functionality ...",
};
