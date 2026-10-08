import { useEffect, useRef, useState } from "react";

export const HANDLE_WIDTH = 4;
const KEYBOARD_STEP = 16;

interface SdSplitHandleProps {
  label: string;
  /** +1 when dragging along the axis widens the first area, -1 when it narrows it */
  sign: 1 | -1;
  /** "vertical" splits left/right areas, "horizontal" splits top/bottom ones. */
  orientation?: "vertical" | "horizontal";
  onResize: (delta: number) => void;
  onReset: () => void;
}

const SdSplitHandle = ({
  label,
  sign,
  orientation = "vertical",
  onResize,
  onReset,
}: SdSplitHandleProps) => {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef(0);
  const horizontal = orientation === "horizontal";
  const cursor = horizontal ? "row-resize" : "col-resize";
  const plusKey = horizontal ? "ArrowDown" : "ArrowRight";
  const minusKey = horizontal ? "ArrowUp" : "ArrowLeft";

  useEffect(() => {
    if (!dragging) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = cursor;
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging, cursor]);

  const positionOf = (event: React.PointerEvent<HTMLElement>) =>
    horizontal ? event.clientY : event.clientX;

  return (
    <div
      role="separator"
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      aria-label={label}
      title="Drag to resize, double-click to reset"
      tabIndex={0}
      data-dragging={dragging}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        lastPos.current = positionOf(event);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const pos = positionOf(event);
        const delta = pos - lastPos.current;
        lastPos.current = pos;
        if (delta !== 0) onResize(sign * delta);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onLostPointerCapture={() => setDragging(false)}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        if (event.key !== plusKey && event.key !== minusKey) return;
        event.preventDefault();
        onResize(sign * (event.key === plusKey ? KEYBOARD_STEP : -KEYBOARD_STEP));
      }}
      style={horizontal ? { height: HANDLE_WIDTH } : { width: HANDLE_WIDTH }}
      className={`shrink-0 touch-none select-none bg-[var(--border-strong)] hover:bg-[var(--accent)] focus:bg-[var(--accent)] data-[dragging=true]:bg-[var(--accent-hover)] ${
        horizontal ? "cursor-row-resize" : "cursor-col-resize"
      }`}
    />
  );
};

export default SdSplitHandle;
