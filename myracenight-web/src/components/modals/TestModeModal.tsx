'use client';

import { useState } from 'react';
import { X, Play, AlertCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

interface TestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestMode: () => void;
  onGoLive: () => void;
  eventName: string;
  hasAllCommentary: boolean;
  racesWithoutCommentary: number;
}

export function TestModeModal({
  isOpen,
  onClose,
  onTestMode,
  onGoLive,
  eventName,
  hasAllCommentary,
  racesWithoutCommentary
}: TestModeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-night-lighter border border-gray-700 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Start Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">"{eventName}"</h3>
            <p className="text-gray-400 text-sm">
              How would you like to proceed?
            </p>
          </div>

          {/* Warning if no commentary */}
          {!hasAllCommentary && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-400 mb-1">Commentary Missing</p>
                  <p className="text-sm text-yellow-200/80">
                    {racesWithoutCommentary} race{racesWithoutCommentary > 1 ? 's' : ''} without AI commentary. 
                    Races will play with original audio only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Mode Option */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Test Run (Recommended)</h4>
                <p className="text-sm text-gray-400">
                  Preview the event without marking it as live. You can stop and restart anytime.
                </p>
              </div>
            </div>
            <Button
              onClick={onTestMode}
              className="w-full"
              variant="secondary"
              leftIcon={<Play className="w-4 h-4" />}
            >
              Start Test Run
            </Button>
          </div>

          {/* Go Live Option */}
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="live" className="flex-shrink-0">🔴 LIVE</Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Go Live Immediately</h4>
                <p className="text-sm text-gray-400">
                  Start the event for real. Cannot be stopped once started.
                </p>
              </div>
            </div>
            <Button
              onClick={onGoLive}
              className="w-full"
              leftIcon={<Play className="w-4 h-4" />}
              disabled={!hasAllCommentary}
            >
              Go Live Now
            </Button>
            {!hasAllCommentary && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Generate all commentary before going live
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Always do a test run first to make sure everything works!
          </p>
        </div>
      </div>
    </div>
  );
}
