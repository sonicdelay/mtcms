import type { ComponentProps } from "../models/component-props";
import type { SdDummyValue } from "./SdDummy";

interface SdDummyLeafComponentProps extends ComponentProps<SdDummyValue> {
  value: SdDummyValue;
  [key: string]: unknown;
}

/** Renders `value` as a string no matter whether it is a string, object or array. */
const format = (value: SdDummyValue) =>
  Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
    ? JSON.stringify(value)
    : value;

/** Leaf variant of SdDummy: shows the formatted value. */
const SdDummyLeafComponent = ({ value }: SdDummyLeafComponentProps) => (
  <span className="Dummy-value">{format(value)}</span>
);

export default SdDummyLeafComponent;
