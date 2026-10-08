import type { ComponentProps } from "../models/component-props";

interface SdKpiProps extends ComponentProps<string | number> {
  value?: string | number;
  label?: string | undefined;
  [key: string]: unknown;
}

const SdKpi = (props: SdKpiProps) => {
  const { value, config, eventIn, onChange, className, label, ...rest } = props;

  return (
    <div
      {...rest}
      className={[
        "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div className="text-2xl font-semibold text-[var(--fg)]">
        {value}
      </div>
      {label && (
        <div className="text-sm text-[var(--fg-muted)]">{label}</div>
      )}
    </div>
  );
};

export default SdKpi;
