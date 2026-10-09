import type { SdComponentProps } from "../models/sd-component-props";

interface SdPageHeaderProps extends SdComponentProps {
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
        "mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div>
        <h1 className="text-xl font-semibold text-[var(--fg)]">{value}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--fg-muted)]">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default SdPageHeader;
