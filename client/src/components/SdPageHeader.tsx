import type { ComponentProps } from "../models/component-props";

interface SdPageHeaderProps extends ComponentProps {
  value?: string;
  subtitle?: string | undefined;
  [key: string]: unknown;
}

const SdPageHeader = (props: SdPageHeaderProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    children,
    className,
    subtitle,
    ...rest
  } = props;

  return (
    <div
      {...rest}
      className={[
        "mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {value}
        </h1>
        {subtitle && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default SdPageHeader;
