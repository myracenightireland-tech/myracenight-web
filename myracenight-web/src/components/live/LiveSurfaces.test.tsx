import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import LiveLeaderboard from './LiveLeaderboard';
import LiveWalletWidget from './LiveWalletWidget';
import { useLiveStore } from '@/store/liveStore';

beforeEach(() => act(() => useLiveStore.getState().reset()));
afterEach(() => cleanup());

describe('LiveLeaderboard — render + reorder', () => {
  it('renders ranked rows in balance order', () => {
    act(() =>
      useLiveStore.getState().setLeaderboard([
        { userId: 'a', name: 'Alice', balance: 500 },
        { userId: 'b', name: 'Bob', balance: 1500 },
        { userId: 'c', name: 'Cara', balance: 1000 },
      ])
    );
    render(<LiveLeaderboard currentUserId="a" />);
    const rows = screen.getAllByTestId('leaderboard-row');
    expect(rows.map((r) => r.getAttribute('data-user-id'))).toEqual(['b', 'c', 'a']);
    // Current user's row is flagged.
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('reorders instantly when a leaderboard:update lands', () => {
    act(() =>
      useLiveStore.getState().setLeaderboard([
        { userId: 'a', name: 'Alice', balance: 500 },
        { userId: 'b', name: 'Bob', balance: 1500 },
        { userId: 'c', name: 'Cara', balance: 1000 },
      ])
    );
    render(<LiveLeaderboard currentUserId="a" />);
    expect(screen.getAllByTestId('leaderboard-row')[0].getAttribute('data-user-id')).toBe('b');

    // Alice wins big → should jump to the top without a re-fetch.
    act(() => useLiveStore.getState().applyLeaderboardUpdate({ userId: 'a', name: 'Alice', balance: 9999 }));
    expect(screen.getAllByTestId('leaderboard-row')[0].getAttribute('data-user-id')).toBe('a');
  });

  it('shows an empty state when there are no standings', () => {
    render(<LiveLeaderboard />);
    expect(screen.getByText(/No standings yet/i)).toBeInTheDocument();
  });
});

describe('LiveWalletWidget — instant balance updates + settling', () => {
  it('renders the current balance and updates on wallet:update', () => {
    act(() => useLiveStore.getState().setBalance(1000));
    render(<LiveWalletWidget />);
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent('€1,000');

    act(() => useLiveStore.getState().applyWalletUpdate({ balance: 750 }));
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent('€750');
  });

  it('shows a settling state after a race completes until settlement lands', () => {
    act(() => {
      useLiveStore.getState().setBalance(1000);
      useLiveStore.getState().markSettling(['bet1']);
    });
    render(<LiveWalletWidget />);
    expect(screen.getByTestId('wallet-settling')).toBeInTheDocument();

    // Settlement arrives via wallet:update → settling clears, balance updates.
    act(() => useLiveStore.getState().applyWalletUpdate({ balance: 1250 }));
    expect(screen.queryByTestId('wallet-settling')).not.toBeInTheDocument();
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent('€1,250');
  });
});
