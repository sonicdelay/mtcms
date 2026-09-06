interface SdButtonProps {
  data?: string;
  className?: string;
}

const SdButton = ({
  data,
  className,
}: SdButtonProps) => {
  
  const buttonClassName = ["Button1", className].join(" ");

  return (
    <div className={buttonClassName}>
        <button>{data ?? "Button2"}</button>
    </div>
  );
}

export default SdButton;
