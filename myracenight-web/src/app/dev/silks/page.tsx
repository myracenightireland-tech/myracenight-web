'use client';

// DEV-ONLY silks gallery: every colour x body pattern, every sleeve/cap
// pattern, and 6 mixed real-world examples. Returns 404 in production.

import { notFound } from 'next/navigation';
import Silks from '@/components/silks/Silks';
import type { SilksSpec } from '@/types';

const COLOURS = [
  'white', 'black', 'red', 'maroon', 'orange', 'yellow', 'emerald green',
  'dark green', 'light green', 'royal blue', 'light blue', 'navy', 'purple',
  'mauve', 'pink', 'grey', 'brown', 'beige',
];

const BODY_PATTERNS = [
  'plain', 'hoops', 'stripes', 'check', 'star', 'disc', 'sash', 'cross belts',
  'chevron', 'spots', 'diamonds', 'halved', 'quartered', 'band', 'seams',
  'epaulettes',
];

const SLEEVE_PATTERNS = [
  'plain', 'hoops', 'stripes', 'check', 'armlets', 'halved', 'chevrons',
  'diamonds', 'spots', 'stars',
];

const CAP_PATTERNS = ['plain', 'hooped', 'striped', 'quartered', 'spotted', 'star', 'diamond'];

function contrast(colour: string): string {
  return ['white', 'yellow', 'beige', 'light blue', 'light green'].includes(colour)
    ? 'black'
    : 'white';
}

function bodySpec(colour: string, pattern: string): SilksSpec {
  return {
    body: { colour, pattern, patternColour: contrast(colour) },
    sleeves: { colour, pattern: 'plain' },
    cap: { colour, pattern: 'plain' },
  };
}

const MIXED_EXAMPLES: { label: string; spec: SilksSpec }[] = [
  {
    label: 'Emerald green, yellow hoops',
    spec: {
      body: { colour: 'emerald green', pattern: 'hoops', patternColour: 'yellow' },
      sleeves: { colour: 'emerald green', pattern: 'plain' },
      cap: { colour: 'yellow', pattern: 'plain' },
    },
  },
  {
    label: 'Maroon, white star',
    spec: {
      body: { colour: 'maroon', pattern: 'star', patternColour: 'white' },
      sleeves: { colour: 'maroon', pattern: 'armlets', patternColour: 'white' },
      cap: { colour: 'maroon', pattern: 'star', patternColour: 'white' },
    },
  },
  {
    label: 'Royal blue / white quarters',
    spec: {
      body: { colour: 'royal blue', pattern: 'quartered', patternColour: 'white' },
      sleeves: { colour: 'white', pattern: 'hoops', patternColour: 'royal blue' },
      cap: { colour: 'white', pattern: 'quartered', patternColour: 'royal blue' },
    },
  },
  {
    label: 'Black, orange sash',
    spec: {
      body: { colour: 'black', pattern: 'sash', patternColour: 'orange' },
      sleeves: { colour: 'orange', pattern: 'chevrons', patternColour: 'black' },
      cap: { colour: 'orange', pattern: 'spotted', patternColour: 'black' },
    },
  },
  {
    label: 'Pink, purple spots',
    spec: {
      body: { colour: 'pink', pattern: 'spots', patternColour: 'purple' },
      sleeves: { colour: 'purple', pattern: 'stars', patternColour: 'pink' },
      cap: { colour: 'purple', pattern: 'hooped', patternColour: 'pink' },
    },
  },
  {
    label: 'Navy, light blue cross belts',
    spec: {
      body: { colour: 'navy', pattern: 'cross belts', patternColour: 'light blue' },
      sleeves: { colour: 'light blue', pattern: 'diamonds', patternColour: 'navy' },
      cap: { colour: 'light blue', pattern: 'diamond', patternColour: 'navy' },
    },
  },
];

export default function SilksGalleryPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-racing-black text-white p-6 space-y-10">
      <h1 className="text-2xl font-bold">Silks Gallery (dev only)</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Null / unknown spec</h2>
        <div className="flex gap-4 items-end">
          <div className="text-center">
            <Silks spec={null} size={64} />
            <p className="text-xs text-gray-400 mt-1">null</p>
          </div>
          <div className="text-center">
            <Silks spec={bodySpec('red', 'zigzag-nonsense')} size={64} />
            <p className="text-xs text-gray-400 mt-1">unknown pattern → plain</p>
          </div>
        </div>
      </section>

      {COLOURS.map((colour) => (
        <section key={colour}>
          <h2 className="text-lg font-semibold mb-3 capitalize">{colour} — body patterns</h2>
          <div className="flex flex-wrap gap-3">
            {BODY_PATTERNS.map((pattern) => (
              <div key={pattern} className="text-center w-20">
                <Silks spec={bodySpec(colour, pattern)} size={64} />
                <p className="text-[10px] text-gray-400 mt-1">{pattern}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-lg font-semibold mb-3">Sleeve patterns</h2>
        <div className="flex flex-wrap gap-3">
          {SLEEVE_PATTERNS.map((pattern) => (
            <div key={pattern} className="text-center w-20">
              <Silks
                spec={{
                  body: { colour: 'grey', pattern: 'plain' },
                  sleeves: { colour: 'red', pattern, patternColour: 'white' },
                  cap: { colour: 'grey', pattern: 'plain' },
                }}
                size={64}
              />
              <p className="text-[10px] text-gray-400 mt-1">{pattern}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Cap patterns</h2>
        <div className="flex flex-wrap gap-3">
          {CAP_PATTERNS.map((pattern) => (
            <div key={pattern} className="text-center w-20">
              <Silks
                spec={{
                  body: { colour: 'grey', pattern: 'plain' },
                  sleeves: { colour: 'grey', pattern: 'plain' },
                  cap: { colour: 'royal blue', pattern, patternColour: 'white' },
                }}
                size={64}
              />
              <p className="text-[10px] text-gray-400 mt-1">{pattern}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Mixed examples</h2>
        <div className="flex flex-wrap gap-4">
          {MIXED_EXAMPLES.map(({ label, spec }) => (
            <div key={label} className="text-center w-32">
              <Silks spec={spec} size={80} />
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
