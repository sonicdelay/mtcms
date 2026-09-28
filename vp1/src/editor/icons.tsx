import type { ReactElement, ReactNode } from "react";

export const iconProps = {
  viewBox: "0 0 24 24",
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type IconComponent = () => ReactElement;

const icon = (children: ReactNode): ReactElement => (
  <svg {...iconProps} aria-hidden="true">{children}</svg>
);

const band = (y: number, h: number, width = 18) => (
  <rect
    x="3"
    y={y}
    width={width}
    height={h}
    fill="currentColor"
    stroke="none"
    opacity="0.4"
  />
);

const dot = (cx: number, cy: number) => (
  <circle cx={cx} cy={cy} r="1.2" fill="currentColor" stroke="none" />
);

const digit = (x: number, y: number, value: string) => (
  <text
    x={x}
    y={y}
    fontSize="9"
    fontFamily="monospace"
    fill="currentColor"
    stroke="none"
  >
    {value}
  </text>
);

const heading = (level: number): IconComponent => () =>
  icon(
    <>
      <path d="M3 6v12M9 6v12M3 12h6" />
      {digit(12.5, 17, String(level))}
    </>,
  );

export const icons = {
  layout: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </>,
    ),
  activity: () => icon(<path d="M2 12h4l3-8 4 16 3-8h6" />),
  trendingUp: () =>
    icon(
      <>
        <path d="M22 7l-8.5 8.5-5-5L2 17" />
        <path d="M16 7h6v6" />
      </>,
    ),
  barChart: () =>
    icon(
      <>
        <path d="M6 20v-8M12 20V5M18 20v-6" />
        <path d="M3 20h18" />
      </>,
    ),
  gauge: () =>
    icon(
      <>
        <path d="M12 14l4-4" />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      </>,
    ),
  textBlock: () =>
    icon(
      <>
        <path d="M5 7V5h14v2" />
        <path d="M12 5v14" />
        <path d="M9 19h6" />
      </>,
    ),
  buttonPointer: () =>
    icon(
      <>
        <rect x="2" y="7" width="20" height="10" rx="5" />
        <path d="M9 12h6" />
      </>,
    ),

  box: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h6M7 13h10M7 17h8" />
      </>,
    ),
  section: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 12h18" />
      </>,
    ),
  article: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h4v6H7z" />
        <path d="M14 9h4M14 13h4" />
      </>,
    ),
  aside: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
        {band(4, 16, 6)}
      </>,
    ),
  nav: () =>
    icon(
      <>
        <path d="M12 3l9 5-9 5-9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>,
    ),
  header: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        {band(4, 5)}
        <path d="M6 13h12" />
      </>,
    ),
  footer: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        {band(15, 5)}
        <path d="M6 11h12" />
      </>,
    ),
  main: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <rect
          x="8"
          y="9"
          width="8"
          height="6"
          rx="1"
          fill="currentColor"
          stroke="none"
        />
      </>,
    ),
  address: () =>
    icon(
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="7.5" cy="10.5" r="2" />
        <path d="M4.5 17c1.6-2.4 4.4-2.4 6 0" />
      </>,
    ),
  hgroup: () => icon(<path d="M4 5h10M4 10h10M4 16h16M4 20h11" />),
  details: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 11l4 4 4-4" />
      </>,
    ),
  dialog: () => icon(<path d="M4 4h16v12H9l-5 4z" />),

  heading1: heading(1),
  heading2: heading(2),
  heading3: heading(3),
  heading4: heading(4),
  heading5: heading(5),
  heading6: heading(6),

  paragraph: () => icon(<path d="M4 6h16M4 12h16M4 18h10" />),
  blockquote: () =>
    icon(
      <>
        <path d="M4 6v12" />
        <path d="M8 7h12M8 12h12M8 17h8" />
      </>,
    ),
  preformatted: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 12h10M7 15h6" />
      </>,
    ),
  rule: () =>
    icon(
      <>
        <path d="M3 8h18" opacity="0.35" />
        <path d="M3 12h18" />
        <path d="M3 16h18" opacity="0.35" />
      </>,
    ),
  lineBreak: () =>
    icon(
      <>
        <path d="M3 6h8a4 4 0 0 1 0 8H7" />
        <path d="M11 11l-3 3 3 3" />
      </>,
    ),
  wordBreak: () =>
    icon(
      <>
        <path d="M3 8h7M14 8h7" />
        <path d="M3 16h18" strokeDasharray="3 3" />
      </>,
    ),
  figure: () =>
    icon(
      <>
        <rect x="4" y="4" width="16" height="11" rx="2" />
        <path d="M8 20h8" />
      </>,
    ),
  orderedList: () =>
    icon(
      <>
        <path d="M10 6h11M10 12h11M10 18h11" />
        {digit(1.5, 8.5, "1")}
        {digit(1.5, 14.5, "2")}
        {digit(1.5, 20.5, "3")}
      </>,
    ),
  unorderedList: () =>
    icon(
      <>
        {dot(4, 6)}
        {dot(4, 12)}
        {dot(4, 18)}
        <path d="M10 6h11M10 12h11M10 18h11" />
      </>,
    ),
  listItem: () =>
    icon(
      <>
        {dot(4, 8)}
        {dot(4, 16)}
        <path d="M10 8h11M10 16h11" />
      </>,
    ),
  descriptionList: () =>
    icon(
      <>
        <path d="M4 7h7M4 11h7M4 15h5" />
        <path d="M14 7h7M14 11h7M14 15h6" />
      </>,
    ),
  term: () => icon(<path d="M4 8h10M4 13h16M4 18h13" />),
  description: () => icon(<path d="M9 8h11M9 13h11M9 18h8" />),

  span: () => icon(<><path d="M3 9v6M21 9v6" /><path d="M7 12h10" /></>),
  link: () =>
    icon(
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </>,
    ),
  bold: () =>
    icon(
      <>
        <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
        <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
      </>,
    ),
  italic: () => icon(<path d="M19 5h-8M13 19H5M15 5l-6 14" />),
  underline: () =>
    icon(
      <>
        <path d="M7 4v7a5 5 0 0 0 10 0V4" />
        <path d="M5 20h14" />
      </>,
    ),
  strikethrough: () =>
    icon(
      <>
        <path d="M16 4H9a3 3 0 0 0-2.83 4" />
        <path d="M14 12a4 4 0 0 1 0 8H6" />
        <path d="M4 12h16" />
      </>,
    ),
  highlight: () =>
    icon(
      <>
        <path d="M13 4l7 7-4 4-7-7z" />
        <path d="M9 8l-5 5v4h4l5-5" />
        <path d="M4 21h16" />
      </>,
    ),
  small: () => icon(<path d="M4 6h10M4 11h10M4 17h7M4 21h7" />),
  subscript: () =>
    icon(
      <>
        <path d="M7 4l4 9h-8z" />
        <path d="M15 17h6" />
      </>,
    ),
  superscript: () =>
    icon(
      <>
        <path d="M7 4l4 9h-8z" />
        <path d="M15 4h6" />
      </>,
    ),
  code: () => icon(<><path d="M9 8l-4 4 4 4" /><path d="M15 8l4 4-4 4" /></>),
  keyboard: () =>
    icon(
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
      </>,
    ),
  citation: () => icon(<path d="M6 3h12v18l-6-4-6 4z" />),
  quotation: () =>
    icon(
      <>
        <path d="M9 7H7a2 2 0 0 0-2 2v3h4z" />
        <path d="M19 7h-2a2 2 0 0 0-2 2v3h4z" />
      </>,
    ),
  abbreviation: () =>
    icon(
      <>
        <path d="M6 15l4-9 4 9M7.5 12.5h5" />
        <path d="M4 19h16" strokeDasharray="2 2" />
      </>,
    ),
  definition: () =>
    icon(
      <>
        <path d="M4 6h16M4 11h16" />
        <path d="M9 20l3-6 3 6z" />
      </>,
    ),
  data: () =>
    icon(
      <>
        <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" />
        <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>,
    ),
  clock: () =>
    icon(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>,
    ),
  ruby: () =>
    icon(
      <>
        <path d="M4 4h16M4 20h16" />
        <path d="M9 8l3-2 3 2v8l-3 2-3-2z" />
      </>,
    ),
  bidi: () =>
    icon(
      <>
        <path d="M4 8h16M4 16h16" />
        <path d="M12 4v16" />
        <path d="M9 7l3-3 3 3M9 17l3 3 3-3" />
      </>,
    ),

  image: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5-5-9 9" />
      </>,
    ),
  frame: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        {dot(6.5, 6.5)}
        <path d="M9 6.5h3" />
      </>,
    ),
  embed: () =>
    icon(
      <>
        <path d="M9 3v6M15 3v6" />
        <path d="M6 9h12v3a6 6 0 0 1-12 0z" />
        <path d="M12 18v3" />
      </>,
    ),
  object: () =>
    icon(
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
        <circle cx="12" cy="12" r="3" />
      </>,
    ),
  video: () =>
    icon(
      <>
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <path d="M16 11l6-3.5v9L16 13z" />
      </>,
    ),
  audio: () =>
    icon(
      <>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </>,
    ),
  track: () =>
    icon(
      <>
        <path d="M3 12h18" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
      </>,
    ),
  mediaSource: () =>
    icon(
      <>
        <path d="M5 3h9l5 5v13H5z" />
        <path d="M14 3v5h5" />
      </>,
    ),
  area: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="12" r="3.5" />
      </>,
    ),
  map: () =>
    icon(
      <>
        <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z" />
        <path d="M9 4v13M15 6.5v13" />
      </>,
    ),

  table: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M3 16h18M9 4v16M15 4v16" />
      </>,
    ),
  column: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </>,
    ),
  tableHead: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        {band(4, 6)}
        <path d="M3 10h18M9 4v16M15 4v16" />
      </>,
    ),
  tableBody: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M3 16h18M9 4v16M15 4v16" />
      </>,
    ),
  tableFoot: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        {band(14, 6)}
        <path d="M3 10h18M9 4v16M15 4v16" />
      </>,
    ),
  tableRow: () =>
    icon(
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M9 6v12M15 6v12" />
      </>,
    ),
  tableHeader: () =>
    icon(
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        {band(6, 6)}
        <path d="M3 12h18" />
      </>,
    ),
  tableCell: () =>
    icon(
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 12h18" />
      </>,
    ),

  form: () =>
    icon(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h6M7 14h10" />
      </>,
    ),
  label: () =>
    icon(
      <>
        <path d="M3 3h8l10 10-8 8L3 11z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </>,
    ),
  input: () =>
    icon(
      <>
        <rect x="2" y="8" width="20" height="8" rx="4" />
        <path d="M10 10.5v3" />
      </>,
    ),
  textarea: () =>
    icon(
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M6 9h12M6 13h8" />
      </>,
    ),
  select: () =>
    icon(
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M9 11l3 3 3-3" />
      </>,
    ),
  optionGroup: () =>
    icon(
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 6v12" />
        <path d="M9 10h10M9 14h6" />
      </>,
    ),
  option: () =>
    icon(
      <>
        <path d="M3 6h18M3 18h18" opacity="0.35" />
        <path d="M8 12l3 3 6-6" />
      </>,
    ),
  output: () =>
    icon(
      <>
        <path d="M5 19a7 7 0 0 1 7-7h7" />
        <path d="M16 9l3 3-3 3" />
      </>,
    ),
  progress: () =>
    icon(
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <rect
          x="5"
          y="7"
          width="9"
          height="10"
          rx="1"
          fill="currentColor"
          stroke="none"
        />
      </>,
    ),
  meter: () =>
    icon(
      <>
        <path d="M4 18a8 8 0 0 1 16 0" />
        <path d="M12 10v8" />
      </>,
    ),
  fieldset: () =>
    icon(
      <>
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M8 4h8v4H8z" />
      </>,
    ),
  button: () =>
    icon(
      <>
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <path d="M8 12h8" />
      </>,
    ),
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof icons;
