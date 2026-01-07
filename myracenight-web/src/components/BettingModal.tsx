'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface Horse {
  id: string;
  name: string;
  ownerName: string;
  jockeyName: string;
  odds?: string;
  position: number;
  silks?: string;
}

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  race: {
    id: string;
    name: string;
    raceNumber: number;
  };
  eventId: string;
  horses: Horse[];
  balance: number;
  onBetPlaced: () => void;
}

type BetType = 'WIN' | 'EACH_WAY';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

// Parse fractional odds to decimal for display
function parseOddsToDecimal(oddsStr: string): number {
  if (!oddsStr || oddsStr === '') return 2;
  if (oddsStr.toLowerCase() === 'evens' || oddsStr.toLowerCase() === 'evs') return 1;
  
  const parts = oddsStr.split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }
  return 2;
}

// Calculate potential return
function calculateReturn(amount: number, odds: string | undefined, betType: BetType): number {
  const oddsDecimal = parseOddsToDecimal(odds || 'evens');
  
  if (betType === 'WIN') {
    return Math.round(amount * oddsDecimal + amount);
  } else {
    // Each-way: half stake on win, half on place
    const halfStake = amount / 2;
    const winReturn = halfStake * oddsDecimal + halfStake;
    const placeOdds = oddsDecimal / 4; // 1/4 odds for place
    const placeReturn = halfStake * placeOdds + halfStake;
    return Math.round(winReturn + placeReturn);
  }
}

export default function BettingModal({
  isOpen,
  onClose,
  race,
  eventId,
  horses,
  balance,
  onBetPlaced,
}: BettingModalProps) {
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [betType, setBetType] = useState<BetType>('WIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedHorse(null);
      setAmount('');
      setBetType('WIN');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, '');
    setAmount(numValue);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handlePlaceBet = async () => {
    if (!selectedHorse) {
      setError('Please select a horse');
      return;
    }

    const betAmount = parseInt(amount);
    if (!betAmount || betAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (betAmount > balance) {
      setError('Insufficient credits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          raceId: race.id,
          horseId: selectedHorse.id,
          amount: betAmount,
          betType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to place bet');
      }

      setSuccess(true);
      
      // Notify parent and close after delay
      setTimeout(() => {
        onBetPlaced();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to place bet');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const betAmount = parseInt(amount) || 0;
  const potentialReturn = selectedHorse ? calculateReturn(betAmount, selectedHorse.odds, betType) : 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50">
      <div className="bg-night-light rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-auto safe-bottom">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-night-lighter flex items-center justify-between sticky top-0 bg-night-light z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Place Your Bet
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">Race {race.raceNumber}: {race.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-2">Bet Placed!</h3>
            <p className="text-gray-400 text-sm sm:text-base">
              {betType} bet of {betAmount.toLocaleString()} on {selectedHorse?.name}
            </p>
            <p className="text-gold font-bold mt-2 text-lg">
              Potential return: {potentialReturn.toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
            {/* Balance Display */}
            <div className="bg-night-lighter rounded-lg p-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Your Balance</span>
              <span className="text-lg sm:text-xl font-bold text-gold">{balance.toLocaleString()}</span>
            </div>

            {/* Horse Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Horse
              </label>
              <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto scrollbar-hide">
                {horses
                  .filter(h => h.position > 0)
                  .sort((a, b) => a.position - b.position)
                  .map((horse) => (
                  <button
                    key={horse.id}
                    onClick={() => setSelectedHorse(horse)}
                    className={`w-full p-3 rounded-lg text-left transition flex items-center justify-between min-h-[56px] ${
                      selectedHorse?.id === horse.id
                        ? 'bg-gold/20 border-2 border-gold'
                        : 'bg-night-lighter hover:bg-white/10 border-2 border-transparent active:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                        {horse.position}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{horse.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {horse.jockeyName}
                        </p>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gold flex-shrink-0 ml-2">
                      {horse.odds || 'evens'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBetType('WIN')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition min-h-[48px] ${
                    betType === 'WIN'
                      ? 'bg-gold text-night'
                      : 'bg-night-lighter hover:bg-white/10 active:bg-white/20'
                  }`}
                >
                  Win
                </button>
                <button
                  onClick={() => setBetType('EACH_WAY')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition min-h-[48px] ${
                    betType === 'EACH_WAY'
                      ? 'bg-gold text-night'
                      : 'bg-night-lighter hover:bg-white/10 active:bg-white/20'
                  }`}
                >
                  Each Way
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {betType === 'WIN' 
                  ? 'Your horse must win to collect'
                  : 'Half on win, half on place (top 3)'
                }
              </p>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-night-lighter border border-night-lighter rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:border-gold min-h-[48px]"
              />
              
              {/* Quick Amount Buttons - Larger on mobile */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-2">
                {[1000, 2500, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAmount(val)}
                    className="py-2.5 sm:py-2 bg-night-lighter rounded hover:bg-white/10 active:bg-white/20 transition text-xs sm:text-sm font-medium min-h-[40px]"
                  >
                    {(val / 1000)}k
                  </button>
                ))}
                <button
                  onClick={() => handleQuickAmount(balance)}
                  className="py-2.5 sm:py-2 bg-gold/20 text-gold rounded hover:bg-gold/30 active:bg-gold/40 transition text-xs sm:text-sm font-medium min-h-[40px]"
                >
                  All In
                </button>
              </div>
            </div>

            {/* Potential Return */}
            {selectedHorse && betAmount > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Potential Return</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-400">
                    {potentialReturn.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button - Fixed at bottom on mobile */}
            <div className="sticky bottom-0 bg-night-light pt-2 pb-4 -mx-3 px-3 sm:relative sm:mx-0 sm:px-0 sm:pb-0">
              <button
                onClick={handlePlaceBet}
                disabled={isLoading || !selectedHorse || !betAmount || betAmount > balance}
                className="w-full py-4 bg-gold text-night rounded-lg font-bold text-base sm:text-lg hover:bg-gold/90 active:bg-gold/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  <>
                    Place Bet: {betAmount.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
