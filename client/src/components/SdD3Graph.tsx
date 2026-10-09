import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useId,
  useRef,
} from "react";
import * as d3 from "d3";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";

export interface SdD3GraphPoint {
  x: number;
  y: number;
}

export interface SdD3GraphValue {
  points: SdD3GraphPoint[];
}

export interface SdD3GraphConfig {
  width?: number;
  height?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  r?: number;
  fill?: string;
  opacity?: number;
  xLabel?: string;
  yLabel?: string;
  scaleExtent?: [number, number];
}

export const DEFAULT_POINTS: SdD3GraphPoint[] = [
  { x: 1, y: 1.2 },
  { x: 1.6, y: 2.4 },
  { x: 2.2, y: 1.8 },
  { x: 2.9, y: 3.1 },
  { x: 3.4, y: 2.7 },
  { x: 4.1, y: 4.2 },
  { x: 4.7, y: 3.6 },
  { x: 5.3, y: 5.1 },
  { x: 6.0, y: 4.4 },
  { x: 6.6, y: 6.2 },
  { x: 7.2, y: 5.5 },
  { x: 7.8, y: 6.9 },
];

const DEFAULT_CONFIG = {
  width: 460,
  height: 400,
  r: 8,
  fill: "var(--accent)",
  opacity: 0.6,
  xLabel: "",
  yLabel: "",
  scaleExtent: [0.5, 20] as [number, number],
};

interface SdD3GraphProps extends SdComponentProps<SdD3GraphValue, SdD3GraphConfig> {
  title?: string;
  width?: number;
  height?: number;
  r?: number;
  fill?: string;
  opacity?: number;
  xLabel?: string;
  yLabel?: string;
  [key: string]: unknown;
}

const num = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const domainOf = (
  points: SdD3GraphPoint[],
  key: "x" | "y",
): [number, number] => {
  const values = points.map((p) => p[key]).filter((v) => Number.isFinite(v));
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? [min - 1, max + 1] : [min, max];
};

const SdD3Graph = (props: SdD3GraphProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    title,
    width,
    height,
    r,
    fill,
    opacity,
    xLabel,
    yLabel,
    ...rest
  } = props;

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (typeof rest.onClick === "function") rest.onClick(event);
    onChange?.({ type: "click", payload: { value } });
  };

  const points =
    value && Array.isArray(value.points) && value.points.length > 0
      ? value.points
      : DEFAULT_POINTS;

  const cfg = {
    ...DEFAULT_CONFIG,
    ...config,
    width: num(width ?? config?.width, DEFAULT_CONFIG.width),
    height: num(height ?? config?.height, DEFAULT_CONFIG.height),
    r: num(r ?? config?.r, DEFAULT_CONFIG.r),
    fill: fill ?? config?.fill ?? DEFAULT_CONFIG.fill,
    opacity: num(opacity ?? config?.opacity, DEFAULT_CONFIG.opacity),
    xLabel: String(xLabel ?? config?.xLabel ?? DEFAULT_CONFIG.xLabel),
    yLabel: String(yLabel ?? config?.yLabel ?? DEFAULT_CONFIG.yLabel),
    scaleExtent:
      Array.isArray(config?.scaleExtent) && config.scaleExtent.length === 2
        ? [num(config.scaleExtent[0], 0.5), num(config.scaleExtent[1], 20)] as [number, number]
        : DEFAULT_CONFIG.scaleExtent,
    xDomain: config?.xDomain,
    yDomain: config?.yDomain,
  };

  const cfgKey = JSON.stringify({ points, cfg });
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const plotWidth = Math.max(1, cfg.width - margin.left - margin.right);
    const plotHeight = Math.max(1, cfg.height - margin.top - margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(cfg.xDomain ?? domainOf(points, "x"))
      .range([0, plotWidth])
      .nice();
    const y = d3
      .scaleLinear()
      .domain(cfg.yDomain ?? domainOf(points, "y"))
      .range([plotHeight, 0])
      .nice();

    const xAxisG = g
      .append("g")
      .attr("class", "d3graph-x-axis")
      .attr("transform", `translate(0,${plotHeight})`);
    const yAxisG = g.append("g").attr("class", "d3graph-y-axis");

    if (cfg.xLabel) {
      g.append("text")
        .attr("class", "d3graph-x-label")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + 26)
        .attr("text-anchor", "middle")
        .text(cfg.xLabel)
        .style("fill", "var(--fg-muted)");
    }
    if (cfg.yLabel) {
      g.append("text")
        .attr("class", "d3graph-y-label")
        .attr("transform", `translate(-44,${plotHeight / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .text(cfg.yLabel)
        .style("fill", "var(--fg-muted)");
    }

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", plotWidth)
      .attr("height", plotHeight);

    const scatter = g.append("g").attr("clip-path", `url(#${clipId})`);
    const circles = scatter
      .selectAll("circle")
      .data(points)
      .join("circle")
      .attr("class", "d3graph-point")
      .attr("r", cfg.r)
      .style("fill", cfg.fill)
      .style("opacity", cfg.opacity);

    const draw = (t: d3.ZoomTransform) => {
      transformRef.current = t;
      const newX = t.rescaleX(x);
      const newY = t.rescaleY(y);
      xAxisG.call(d3.axisBottom(newX));
      yAxisG.call(d3.axisLeft(newY));
      xAxisG.selectAll(".tick text").style("fill", "var(--fg-muted)");
      yAxisG.selectAll(".tick text").style("fill", "var(--fg-muted)");
      xAxisG.selectAll(".tick line").style("stroke", "var(--border)");
      yAxisG.selectAll(".tick line").style("stroke", "var(--border)");
      xAxisG.select(".domain").style("stroke", "var(--border)");
      yAxisG.select(".domain").style("stroke", "var(--border)");
      circles.attr("cx", (d) => newX(d.x)).attr("cy", (d) => newY(d.y));
    };

    const overlay = g
      .append("rect")
      .attr("class", "d3graph-zoom-overlay")
      .attr("width", plotWidth)
      .attr("height", plotHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([cfg.scaleExtent[0], cfg.scaleExtent[1]])
      .extent([
        [0, 0],
        [plotWidth, plotHeight],
      ])
      .on("zoom", (event) => draw(event.transform));

    overlay.call(zoom);
    let chartPointer = false;
    const resetPointer = () => {
      chartPointer = false;
    };
    const setChartPointer = () => {
      chartPointer = true;
    };
    const wrapper = svgEl.closest<HTMLElement>("[draggable]");
    const cancelDrag = (event: DragEvent) => {
      if (!chartPointer) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("mousedown", resetPointer, true);
    overlay.on("mousedown.sdd3graph", setChartPointer);
    const restored = transformRef.current ?? d3.zoomIdentity;
    draw(restored);
    if (transformRef.current) overlay.call(zoom.transform, restored);
    return () => {
      window.removeEventListener("mousedown", resetPointer, true);
      overlay.on("mousedown.sdd3graph", null);
      wrapper?.removeEventListener("dragstart", cancelDrag);
    };
  }, [cfgKey, clipId]);

  const graphClassName = ["D3Graph", rest.className].filter(Boolean).join(" ");

  return (
    <div {...rest} className={graphClassName} onClick={handleClick}>
      {title && (
        <h2 className="mb-2 font-semibold text-[var(--fg)]">{title}</h2>
      )}
      <svg
        ref={svgRef}
        width={cfg.width}
        height={cfg.height}
        style={{ display: "block" }}
      />
    </div>
  );
};

export default SdD3Graph;
