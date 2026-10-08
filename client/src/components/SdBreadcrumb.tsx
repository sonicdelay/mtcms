import type { ComponentProps } from "../models/component-props";
import { SdIcon } from "./icons";

export interface SdBreadcrumbItem {
  id: string;
  label: string;
}

export interface SdBreadcrumbValue {
  current: SdBreadcrumbItem[];
  next?: SdBreadcrumbItem[] | undefined;
}

interface SdBreadcrumbProps extends ComponentProps<SdBreadcrumbValue> {
  value?: SdBreadcrumbValue | undefined;
  onSelect?: ((id: string) => void) | undefined;
  [key: string]: unknown;
}

const SdBreadcrumb = (props: SdBreadcrumbProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    children,
    className,
    onSelect,
    ...rest
  } = props;

  const handleSelect = (id: string) => {
    onSelect?.(id);
    onChange?.({ type: "select", payload: { value: id } });
  };

  const crumbs = value?.current ?? [];

  return (
    <nav
      {...rest}
      className={["flex flex-wrap items-center gap-1 text-sm", className]
        .filter(Boolean).join(" ")}
      aria-label="Breadcrumb"
    >
      {crumbs.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          {index > 0 && <SdIcon name="chevronRight" size={12} />}
          <button
            type="button"
            className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
            onClick={() =>
              handleSelect(item.id)}
          >
            {item.label}
          </button>
        </span>
      ))}
      {value?.next && value.next.length > 0 && (
        <span className="flex items-center gap-1">
          <SdIcon name="chevronRight" size={12} />
          <span className="text-[var(--fg-subtle)]">››</span>
          {value.next.map((item) => (
            <span key={item.id} className="flex items-center gap-1">
              <button
                type="button"
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
                onClick={() =>
                  handleSelect(item.id)}
              >
                {item.label}
              </button>
            </span>
          ))}
        </span>
      )}
    </nav>
  );
};

export default SdBreadcrumb;
