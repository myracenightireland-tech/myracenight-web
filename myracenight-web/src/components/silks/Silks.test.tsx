import { render, screen } from '@testing-library/react';
import Silks from './Silks';
import type { SilksSpec } from '@/types';

const SPEC: SilksSpec = {
  body: { colour: 'emerald green', pattern: 'hoops', patternColour: 'yellow' },
  sleeves: { colour: 'white', pattern: 'plain' },
  cap: { colour: 'royal blue', pattern: 'plain' },
};

describe('Silks', () => {
  it('renders a null spec as a mid-grey jersey with a "?" and never throws', () => {
    render(<Silks spec={null} size={44} />);
    const svg = screen.getByTestId('silks');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', 'Unknown silks');
    expect(screen.getByTestId('silks-unknown')).toHaveTextContent('?');
    expect(screen.getByTestId('silks-body')).toHaveAttribute('fill', '#9CA3AF');
  });

  it('renders an invalid spec shape like null (never throws)', () => {
    render(<Silks spec={{ body: { colour: 'red' } } as any} size={44} />);
    expect(screen.getByTestId('silks-unknown')).toBeInTheDocument();
  });

  it('applies the expected fills from the colour map', () => {
    render(<Silks spec={SPEC} size={44} />);
    expect(screen.getByTestId('silks-body')).toHaveAttribute('fill', '#009B48');
    expect(screen.getByTestId('silks-sleeve')).toHaveAttribute('fill', '#FFFFFF');
    expect(screen.getByTestId('silks-cap')).toHaveAttribute('fill', '#2244AA');
    // hoops pattern rendered in the pattern colour
    const pattern = screen.getByTestId('silks-pattern-body');
    expect(pattern.querySelectorAll('rect[fill="#FFD100"]').length).toBeGreaterThan(0);
  });

  it('falls back to plain for an unknown pattern', () => {
    render(
      <Silks
        spec={{
          ...SPEC,
          body: { colour: 'red', pattern: 'zigzag-nonsense' },
        }}
        size={44}
      />,
    );
    expect(screen.getByTestId('silks-body')).toHaveAttribute('fill', '#D7263D');
    expect(screen.queryByTestId('silks-pattern-body')).not.toBeInTheDocument();
    expect(screen.queryByTestId('silks-unknown')).not.toBeInTheDocument();
  });

  it('builds the aria-label from the spec with no visible description text', () => {
    render(<Silks spec={SPEC} size={44} />);
    const svg = screen.getByTestId('silks');
    expect(svg).toHaveAttribute(
      'aria-label',
      'emerald green body with yellow hoops, white sleeves, royal blue cap',
    );
    // The only text node ever rendered is the "?" for unknown specs
    expect(svg.querySelector('text')).toBeNull();
  });

  it('respects the size prop', () => {
    render(<Silks spec={SPEC} size={32} />);
    const svg = screen.getByTestId('silks');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});
