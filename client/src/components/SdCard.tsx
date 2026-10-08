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
        "rounded-lg border border-zinc-200 bg-white p-4 text-sm",
        "dark:border-zinc-700 dark:bg-zinc-900",
        className,
      ].filter(Boolean).join(" ")}
    >
      {value && (
        <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {value}
        </h3>
      )}
      {children}
    </div>
  );
};

export default SdCard;
