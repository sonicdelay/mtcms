import { useEffect, useRef, useState } from "react";

export const HANDLE_WIDTH = 4;
const KEYBOARD_STEP = 16;

interface SdSplitHandleProps {
  label: string;
  /** +1 when dragging right widens the panel, -1 when it narrows it */
  sign: 1 | -1;
  onResize: (deltaX: number) => void;
  onReset: () => void;
}

export default function SdSplitHandle(
  { label, sign, onResize, onReset }: SdSplitHandleProps,
) {
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);

  useEffect(() => {
    if (!dragging) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title="Drag to resize, double-click to reset"
      tabIndex={0}
      data-dragging={dragging}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        lastX.current = event.clientX;
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const delta = event.clientX - lastX.current;
        lastX.current = event.clientX;
        if (delta !== 0) onResize(sign * delta);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onLostPointerCapture={() => setDragging(false)}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        onResize(
          sign * (event.key === "ArrowRight" ? KEYBOARD_STEP : -KEYBOARD_STEP),
        );
      }}
      style={{ width: HANDLE_WIDTH }}
      className="shrink-0 touch-none select-none cursor-col-resize bg-gray-800 hover:bg-teal-600 focus:bg-teal-600 data-[dragging=true]:bg-teal-500"
    />
  );
}
