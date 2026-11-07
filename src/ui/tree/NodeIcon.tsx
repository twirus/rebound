import type { JSX } from 'preact';
import type { IconId } from '../../content/types';

/** Line drawings on a 20×20 grid; stroke colour comes from CSS (currentColor). */
const SHAPES: Readonly<Record<IconId, JSX.Element>> = {
  ball: <circle cx="10" cy="10" r="5" />,
  hit: <path d="M3 4v12M7 10h9M13 7l3 3-3 3" />,
  collision: (
    <>
      <circle cx="6.5" cy="10" r="4" />
      <circle cx="13.5" cy="10" r="4" />
    </>
  ),
  speed: <path d="M3 7h8M5 10h10M3 13h8M14 6l4 4-4 4" />,
  arena: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="12.5" r="2" />
    </>
  ),
  limit: <path d="M4 16h12M6 16V8M10 16V5M14 16V8M3 3h14" />,
  tap: (
    <>
      <circle cx="10" cy="10" r="2" />
      <path d="M10 3v3M10 14v3M3 10h3M14 10h3" />
    </>
  ),
  cooldown: (
    <>
      <circle cx="10" cy="11" r="6.5" />
      <path d="M10 7.5V11l2.5 2M8 2.5h4" />
    </>
  ),
  reach: (
    <>
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="4.5" />
      <circle cx="10" cy="10" r="7.5" />
    </>
  ),
  auto: <path d="M15.5 6.5A6.5 6.5 0 1 0 16.5 11M16 3v4h-4" />,
  echo: <path d="M4 10h2M8 6v8M12 4v12M16 7v6" />,
  amplifier: <path d="M3 16 10 4l7 12zM10 9v4" />,
  triangle: <path d="M10 3 17.5 16h-15z" />,
  square: <rect x="4" y="4" width="12" height="12" />,
  hexagon: <path d="M6 3.5h8l4 6.5-4 6.5H6L2 10z" />,
  mass: (
    <>
      <circle cx="10" cy="11" r="6" />
      <path d="M7 11h6" />
    </>
  ),
  gem: <path d="M10 2.5 17.5 10 10 17.5 2.5 10z" />,
  link: (
    <>
      <circle cx="4.5" cy="10" r="2" />
      <circle cx="15.5" cy="10" r="2" />
      <path d="M6.5 10h7" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4h3" />
    </>
  ),
  note: (
    <path d="M8 15V4l8-1.5v10M8 15a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 12.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" />
  ),
  core: (
    <>
      <path d="M10 2.5 16.5 6.25v7.5L10 17.5l-6.5-3.75v-7.5z" />
      <circle cx="10" cy="10" r="2.5" />
    </>
  ),
};

export function NodeIcon({ icon, size = 20 }: { icon: IconId; size?: number }) {
  return (
    <svg class="node-icon" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      {SHAPES[icon]}
    </svg>
  );
}
