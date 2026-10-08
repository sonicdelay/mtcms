import type { ComponentProps } from "../models/component-props";

interface SdCardProps extends ComponentProps {
  value?: string;
  [key: string]: unknown;
}

const SdCard = (props: SdCardProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } =
    props;

  return (
    <div
      {...rest}
      className={[
        "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm",
        className,
      ].filter(Boolean).join(" ")}
    >
      {value && (
        <h3 className="mb-2 font-semibold text-[var(--fg)]">{value}</h3>
      )}
      {children}
    </div>
  );
};

export default SdCard;
