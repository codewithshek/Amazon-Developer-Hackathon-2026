import type { ReactNode, SVGProps } from "react";

export type GlyphName =
  | "up"
  | "down"
  | "left"
  | "right"
  | "enter"
  | "back"
  | "sound"
  | "mute"
  | "external"
  | "reset"
  | "check"
  | "mic"
  | "play"
  | "pause"
  | "shield"
  | "arrow"
  | "home"
  | "power"
  | "chevron"
  | "dot";

const paths: Record<GlyphName, ReactNode> = {
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m10 6 6 6-6 6" />,
  enter: (
    <>
      <path d="M9 10 5 14l4 4" />
      <path d="M5 14h9a5 5 0 0 0 5-5V6" />
    </>
  ),
  back: <path d="M15 5 8 12l7 7" />,
  sound: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  mute: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6" />
      <path d="m21 9-5 6" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 14v5H5V6h5" />
    </>
  ),
  reset: (
    <>
      <path d="M4.5 10a8 8 0 1 1 2.2 6.8" />
      <path d="M4 5v5h5" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 6.5" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </>
  ),
  play: <path d="M7 5v14l12-7Z" />,
  pause: (
    <>
      <path d="M8.5 5v14" />
      <path d="M15.5 5v14" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  power: (
    <>
      <path d="M12 3v9" />
      <path d="M6.5 6.5a8 8 0 1 0 11 0" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  dot: <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
};

interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: GlyphName;
  size?: number;
}

export function Glyph({ name, size = 18, ...rest }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
