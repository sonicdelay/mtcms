import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdPageHeaderConfig } from "../models/sd-page-header";

interface SdPageHeaderProps extends SdComponentProps<unknown, SdPageHeaderConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdPageHeaderConfig = {};

const SdPageHeader = (props: SdPageHeaderProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  return (
    <header {...rest} className={["sd-page-header", className].filter(Boolean).join(" ")}>
      <h1 className="sd-page-header__title">{value as any}</h1>
      {settings.subtitle && <div className="sd-page-header__subtitle">{settings.subtitle}</div>}
      {children}
    </header>
  );
};

export default SdPageHeader;
