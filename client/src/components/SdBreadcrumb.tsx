import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type {
  SdBreadcrumbConfig,
  SdBreadcrumbItem,
  SdBreadcrumbValue,
} from "../models/sd-breadcrumb";

interface SdBreadcrumbProps
  extends SdComponentProps<SdBreadcrumbValue, SdBreadcrumbConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdBreadcrumbConfig = {};

const SdBreadcrumb = (props: SdBreadcrumbProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } =
    props;
  const settings = { ...DEFAULT_CONFIG, ...config };
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const items = Array.isArray(value) ? value : [];

  return (
    <nav
      {...rest}
      className={["sd-breadcrumb", className].filter(Boolean).join(" ")}
    >
      {items.map((item: SdBreadcrumbItem, index: number) => (
        <span key={item.id} className="sd-breadcrumb__item">
          <span
            className="sd-breadcrumb__link"
            onClick={() => {
              settings.onSelect?.(item);
              onChange?.({ type: "select", payload: { item } });
            }}
          >
            {item.label}
          </span>
          {index < items.length - 1 && (
            <span className="sd-breadcrumb__separator">/</span>
          )}
        </span>
      ))}
      {children}
    </nav>
  );
};

export default SdBreadcrumb;
