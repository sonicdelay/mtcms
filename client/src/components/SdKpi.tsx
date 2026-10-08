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
        "rounded-lg border border-zinc-200 bg-white p-4",
        "dark:border-zinc-700 dark:bg-zinc-900",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      {label && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
      )}
    </div>
  );
};

export default SdKpi;
