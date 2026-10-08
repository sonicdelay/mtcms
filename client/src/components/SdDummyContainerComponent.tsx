import {
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

type EventHandler = (event: ComponentEvent) => void;

interface SdDummyContainerComponentProps extends ComponentProps {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Nested event capture
// ---------------------------------------------------------------------------
// Children are rendered outside of this component by the layout renderer, so
// their events would normally bypass `onChange`. `capture` re-clones the child
// tree and installs a forwarding `onChange` on every node that already has one.

const MAX_CAPTURE_DEPTH = 20;

/** Normalizes a `children` value to an array, or `null` when there are none. */
const list = (children: ReactNode): ReactNode[] | null =>
  children === null || children === undefined
    ? null
    : (Array.isArray(children) ? children : [children]);

/**
 * Recursively wires nested child events back to SdDummy's own `onChange`.
 * Failsafe: bounded depth, host/fragment nodes are ignored, a child handler
 * that throws is caught so forwarding still happens, and a `cloneElement`
 * failure falls back to the untouched node.
 */
const capture = (
  node: ReactNode,
  onChange?: EventHandler,
  depth = 0,
): ReactNode => {
  if (
    depth >= MAX_CAPTURE_DEPTH ||
    !isValidElement(node) ||
    typeof node.type === "string" ||
    node.type === Fragment
  ) {
    return node;
  }

  const element = node as ReactElement<ComponentProps>;
  const original = element.props.onChange;
  // Only wrap children that already participate in the event bus; injecting a
  // fresh onChange into a component that ignores it would leak onto the DOM.
  if (typeof original !== "function" && original !== onChange) return node;

  const childList = list(element.props.children as ReactNode | undefined);
  try {
    return cloneElement(element, {
      onChange: (event: ComponentEvent) => {
        // Preserve the child's own handler, unless it IS our onChange (avoids
        // firing the same handler twice via inheritance).
        if (typeof original === "function" && original !== onChange) {
          try {
            original(event);
          } catch (error) {
            console.error(
              "SdDummy: nested child onChange handler threw",
              error,
            );
          }
        }
        onChange?.(event);
      },
      children: childList
        ? childList.map((child) => capture(child, onChange, depth + 1))
        : element.props.children,
    });
  } catch (error) {
    console.error("SdDummy: failed to capture nested events", error);
    return node;
  }
};

/** Nested variant of SdDummy: renders children and routes their events to onChange. */
const SdDummyContainerComponent = ({
  children,
  onChange,
}: SdDummyContainerComponentProps) => (
  <div className="Dummy-children">{capture(children, onChange)}</div>
);

export default SdDummyContainerComponent;
