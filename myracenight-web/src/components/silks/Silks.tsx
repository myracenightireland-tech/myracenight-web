// SILKS — pure SVG rendering of a runner's racing silks from a structured
// silksSpec ({ body, sleeves, cap }, each { colour, pattern, patternColour? }).
// Null/invalid spec renders a mid-grey jersey with a "?" and NEVER throws.
// Unknown patterns/colours degrade to plain. No visible text besides the "?".

import { useId } from 'react';
import type { ReactNode } from 'react';
import type { SilksSpec, SilksSpecPart } from '@/types';

interface SilksProps {
  spec: SilksSpec | null | undefined;
  size: number;
  className?: string;
}

// Standard racing colours
const COLOURS: Record<string, string> = {
  white: '#FFFFFF',
  black: '#1F1F1F',
  red: '#D7263D',
  maroon: '#6E1423',
  orange: '#F77F00',
  yellow: '#FFD100',
  'emerald green': '#009B48',
  'dark green': '#1B4D3E',
  'light green': '#7FB800',
  'royal blue': '#2244AA',
  'light blue': '#6EC1E4',
  navy: '#1B2A5B',
  purple: '#6A0DAD',
  mauve: '#B784A7',
  pink: '#FF7BAC',
  grey: '#8D99AE',
  brown: '#7F4F24',
  beige: '#D9C5A0',
};

const MID_GREY = '#9CA3AF';
const OUTLINE = 'rgba(0,0,0,0.35)';
// Base colours light enough that a white default pattern would vanish
const LIGHT_COLOURS = new Set(['white', 'yellow', 'beige', 'light blue', 'light green']);

const PATTERN_ALIASES: Record<string, string> = {
  hooped: 'hoops',
  striped: 'stripes',
  spotted: 'spots',
  'cross belts': 'crossbelts',
  'cross-belts': 'crossbelts',
};

function colourOf(name: string): string {
  const key = (name || '').trim().toLowerCase();
  return COLOURS[key] ?? (key ? name : MID_GREY);
}

function defaultPatternColour(baseColourName: string): string {
  return LIGHT_COLOURS.has((baseColourName || '').trim().toLowerCase())
    ? '#1F1F1F'
    : '#FFFFFF';
}

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(2)},${(cy + rr * Math.sin(rad)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function diamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}

/**
 * Pattern shapes for one region, drawn oversized and clipped to the region's
 * shape by the caller. Returns [] (plain) for unknown patterns.
 */
function renderPattern(region: Region, rawPattern: string, fill: string): ReactNode[] {
  const { x, y, w, h } = region;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const min = Math.min(w, h);
  const key = (rawPattern || '').trim().toLowerCase();
  const pattern = PATTERN_ALIASES[key] ?? key;
  const out: ReactNode[] = [];

  switch (pattern) {
    case 'plain':
      break;
    case 'hoops':
      [0.18, 0.45, 0.72].forEach((f, i) =>
        out.push(<rect key={i} x={x} y={y + h * f} width={w} height={h / 7} fill={fill} />),
      );
      break;
    case 'stripes':
      [0.18, 0.45, 0.72].forEach((f, i) =>
        out.push(<rect key={i} x={x + w * f} y={y} width={w / 7} height={h} fill={fill} />),
      );
      break;
    case 'check': {
      const s = w / 4;
      for (let r = 0; r < Math.ceil(h / s); r++) {
        for (let c = 0; c < 4; c++) {
          if ((r + c) % 2 === 0) {
            out.push(
              <rect key={`${r}-${c}`} x={x + c * s} y={y + r * s} width={s} height={s} fill={fill} />,
            );
          }
        }
      }
      break;
    }
    case 'star':
      out.push(<polygon key="s" points={starPoints(cx, cy, min * 0.42)} fill={fill} />);
      break;
    case 'stars':
      [
        [0.5, 0.2],
        [0.5, 0.5],
        [0.5, 0.8],
      ].forEach(([fx, fy], i) =>
        out.push(
          <polygon key={i} points={starPoints(x + w * fx, y + h * fy, min * 0.24)} fill={fill} />,
        ),
      );
      break;
    case 'disc':
      out.push(<circle key="d" cx={cx} cy={cy} r={min * 0.32} fill={fill} />);
      break;
    case 'sash':
      out.push(
        <rect
          key="s"
          x={cx - w}
          y={cy - h * 0.09}
          width={w * 2}
          height={h * 0.18}
          fill={fill}
          transform={`rotate(32 ${cx} ${cy})`}
        />,
      );
      break;
    case 'crossbelts':
      [32, -32].forEach((deg, i) =>
        out.push(
          <rect
            key={i}
            x={cx - w}
            y={cy - h * 0.07}
            width={w * 2}
            height={h * 0.14}
            fill={fill}
            transform={`rotate(${deg} ${cx} ${cy})`}
          />,
        ),
      );
      break;
    case 'chevron':
    case 'chevrons': {
      const offsets = pattern === 'chevron' ? [0.38] : [0.15, 0.45, 0.75];
      offsets.forEach((f, i) =>
        out.push(
          <polygon
            key={i}
            points={[
              `${x},${y + h * (f + 0.18)}`,
              `${cx},${y + h * f}`,
              `${x + w},${y + h * (f + 0.18)}`,
              `${x + w},${y + h * (f + 0.3)}`,
              `${cx},${y + h * (f + 0.12)}`,
              `${x},${y + h * (f + 0.3)}`,
            ].join(' ')}
            fill={fill}
          />,
        ),
      );
      break;
    }
    case 'spots':
      [
        [0.3, 0.22],
        [0.7, 0.22],
        [0.5, 0.5],
        [0.3, 0.78],
        [0.7, 0.78],
      ].forEach(([fx, fy], i) =>
        out.push(<circle key={i} cx={x + w * fx} cy={y + h * fy} r={min * 0.13} fill={fill} />),
      );
      break;
    case 'diamond':
      out.push(<polygon key="d" points={diamondPoints(cx, cy, min * 0.4)} fill={fill} />);
      break;
    case 'diamonds':
      [
        [0.5, 0.18],
        [0.25, 0.5],
        [0.75, 0.5],
        [0.5, 0.82],
      ].forEach(([fx, fy], i) =>
        out.push(
          <polygon key={i} points={diamondPoints(x + w * fx, y + h * fy, min * 0.22)} fill={fill} />,
        ),
      );
      break;
    case 'halved':
      out.push(<rect key="h" x={x} y={y} width={w / 2} height={h} fill={fill} />);
      break;
    case 'quartered':
      out.push(<rect key="tl" x={x} y={y} width={w / 2} height={h / 2} fill={fill} />);
      out.push(<rect key="br" x={cx} y={cy} width={w / 2} height={h / 2} fill={fill} />);
      break;
    case 'band':
      out.push(<rect key="b" x={x} y={cy - h * 0.1} width={w} height={h * 0.2} fill={fill} />);
      break;
    case 'armlets':
      [0.3, 0.6].forEach((f, i) =>
        out.push(<rect key={i} x={x} y={y + h * f} width={w} height={h * 0.12} fill={fill} />),
      );
      break;
    case 'seams':
      [24, -24].forEach((deg, i) =>
        out.push(
          <rect
            key={i}
            x={cx - w}
            y={cy - h * 0.025}
            width={w * 2}
            height={h * 0.05}
            fill={fill}
            transform={`rotate(${deg} ${cx} ${cy})`}
          />,
        ),
      );
      break;
    case 'epaulettes':
      out.push(<rect key="l" x={x} y={y} width={w * 0.32} height={h * 0.14} fill={fill} />);
      out.push(<rect key="r" x={x + w * 0.68} y={y} width={w * 0.32} height={h * 0.14} fill={fill} />);
      break;
    default:
      // Unknown pattern -> plain
      break;
  }
  return out;
}

function validPart(part: unknown): SilksSpecPart | null {
  if (!part || typeof part !== 'object') return null;
  const p = part as SilksSpecPart;
  if (typeof p.colour !== 'string' || typeof p.pattern !== 'string') return null;
  return p;
}

function partLabel(kind: string, part: SilksSpecPart): string {
  const pattern = (part.pattern || 'plain').trim().toLowerCase();
  if (pattern === 'plain') return `${part.colour} ${kind}`;
  return part.patternColour
    ? `${part.colour} ${kind} with ${part.patternColour} ${pattern}`
    : `${part.colour} ${kind} with ${pattern}`;
}

// Geometry (viewBox 0 0 64 64)
const BODY_PATH =
  'M22 24 Q22 22 24 22 L28 22 Q32 27 36 22 L40 22 Q42 22 42 24 L42 56 Q42 58 40 58 L24 58 Q22 58 22 56 Z';
const BODY_REGION: Region = { x: 22, y: 22, w: 20, h: 36 };
const SLEEVE_L_REGION: Region = { x: -11, y: 0, w: 10, h: 20 };
const SLEEVE_R_REGION: Region = { x: 1, y: 0, w: 10, h: 20 };
const CAP_PATH = 'M22 14 A10 10 0 0 1 42 14 Z';
const CAP_REGION: Region = { x: 22, y: 4, w: 20, h: 10 };

export default function Silks({ spec, size, className }: SilksProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clipId = (part: string) => `silks-${part}-${uid}`;

  const body = validPart(spec?.body);
  const sleeves = validPart(spec?.sleeves);
  const cap = validPart(spec?.cap);
  const known = Boolean(spec && body && sleeves && cap);

  const bodyFill = known ? colourOf(body!.colour) : MID_GREY;
  const sleeveFill = known ? colourOf(sleeves!.colour) : MID_GREY;
  const capFill = known ? colourOf(cap!.colour) : MID_GREY;

  const bodyPattern = known
    ? renderPattern(
        BODY_REGION,
        body!.pattern,
        colourOf(body!.patternColour || defaultPatternColour(body!.colour)),
      )
    : [];
  const sleevePatternL = known
    ? renderPattern(
        SLEEVE_L_REGION,
        sleeves!.pattern,
        colourOf(sleeves!.patternColour || defaultPatternColour(sleeves!.colour)),
      )
    : [];
  const sleevePatternR = known
    ? renderPattern(
        SLEEVE_R_REGION,
        sleeves!.pattern,
        colourOf(sleeves!.patternColour || defaultPatternColour(sleeves!.colour)),
      )
    : [];
  const capPattern = known
    ? renderPattern(
        CAP_REGION,
        cap!.pattern,
        colourOf(cap!.patternColour || defaultPatternColour(cap!.colour)),
      )
    : [];

  const label = known
    ? [partLabel('body', body!), partLabel('sleeves', sleeves!), partLabel('cap', cap!)].join(', ')
    : 'Unknown silks';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
      className={className}
      data-testid="silks"
    >
      <defs>
        <clipPath id={clipId('body')}>
          <path d={BODY_PATH} />
        </clipPath>
        <clipPath id={clipId('sleeve-l')}>
          <rect
            x={SLEEVE_L_REGION.x}
            y={SLEEVE_L_REGION.y}
            width={SLEEVE_L_REGION.w}
            height={SLEEVE_L_REGION.h}
            rx={3}
          />
        </clipPath>
        <clipPath id={clipId('sleeve-r')}>
          <rect
            x={SLEEVE_R_REGION.x}
            y={SLEEVE_R_REGION.y}
            width={SLEEVE_R_REGION.w}
            height={SLEEVE_R_REGION.h}
            rx={3}
          />
        </clipPath>
        <clipPath id={clipId('cap')}>
          <path d={CAP_PATH} />
        </clipPath>
      </defs>

      {/* Left sleeve */}
      <g transform="translate(23 23) rotate(26)">
        <g clipPath={`url(#${clipId('sleeve-l')})`}>
          <rect
            x={SLEEVE_L_REGION.x}
            y={SLEEVE_L_REGION.y}
            width={SLEEVE_L_REGION.w}
            height={SLEEVE_L_REGION.h}
            fill={sleeveFill}
            data-testid="silks-sleeve"
          />
          {sleevePatternL}
        </g>
        <rect
          x={SLEEVE_L_REGION.x}
          y={SLEEVE_L_REGION.y}
          width={SLEEVE_L_REGION.w}
          height={SLEEVE_L_REGION.h}
          rx={3}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={1}
        />
      </g>

      {/* Right sleeve */}
      <g transform="translate(41 23) rotate(-26)">
        <g clipPath={`url(#${clipId('sleeve-r')})`}>
          <rect
            x={SLEEVE_R_REGION.x}
            y={SLEEVE_R_REGION.y}
            width={SLEEVE_R_REGION.w}
            height={SLEEVE_R_REGION.h}
            fill={sleeveFill}
          />
          {sleevePatternR}
        </g>
        <rect
          x={SLEEVE_R_REGION.x}
          y={SLEEVE_R_REGION.y}
          width={SLEEVE_R_REGION.w}
          height={SLEEVE_R_REGION.h}
          rx={3}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={1}
        />
      </g>

      {/* Body */}
      <g clipPath={`url(#${clipId('body')})`}>
        <path d={BODY_PATH} fill={bodyFill} data-testid="silks-body" />
        {bodyPattern.length > 0 && <g data-testid="silks-pattern-body">{bodyPattern}</g>}
      </g>
      <path d={BODY_PATH} fill="none" stroke={OUTLINE} strokeWidth={1} />

      {/* Cap */}
      <g clipPath={`url(#${clipId('cap')})`}>
        <path d={CAP_PATH} fill={capFill} data-testid="silks-cap" />
        {capPattern}
      </g>
      <path d={CAP_PATH} fill="none" stroke={OUTLINE} strokeWidth={1} />
      <rect x={20.5} y={13.6} width={23} height={2.4} rx={1.2} fill={capFill} stroke={OUTLINE} strokeWidth={0.8} />
      <circle cx={32} cy={4.6} r={1.6} fill={capFill} stroke={OUTLINE} strokeWidth={0.8} />

      {/* Unknown spec: mid-grey jersey with a "?" */}
      {!known && (
        <text
          x={32}
          y={46}
          textAnchor="middle"
          fontSize={18}
          fontWeight={700}
          fill="#374151"
          data-testid="silks-unknown"
        >
          ?
        </text>
      )}
    </svg>
  );
}
