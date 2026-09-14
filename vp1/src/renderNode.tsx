import { createElement, Fragment, type ReactNode } from "react";
import { components } from "./components";
import type { LayoutChild } from "./layoutTypes";

export default function renderNode(
  node: LayoutChild,
  path = "0",
  inheritedProps: Record<string, unknown> = {},
): ReactNode {
  if (typeof node === "string") {
    return createElement("span", { key: path, ...inheritedProps }, node);
  }

  const { type, children, ...props } = node;
  const mergedProps = { ...inheritedProps, ...props };
  const Component = components[type] ?? type ??
    (() => createElement(Fragment, null, `${type} ???`));

  return createElement(
    Component,
    { key: path, ...mergedProps },
    Array.isArray(children)
      ? children.map((child: LayoutChild, index: number) =>
        renderNode(child, `${path}.${index}`, mergedProps)
      )
      : children,
  );
}
