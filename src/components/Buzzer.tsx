'use client';

import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuzzerProps {
  onBuzz: () => void;
  disabled: boolean;
  isBuzzed: boolean;
}

export function Buzzer({ onBuzz, disabled, isBuzzed }: BuzzerProps) {
  const buttonText = isBuzzed ? "You've Buzzed!" : 'BUZZ!';
  const canBuzz = !disabled && !isBuzzed;

  return (
    <Button
      onClick={onBuzz}
      disabled={!canBuzz}
      className={cn(
        `w-full h-48 md:h-64 text-4xl md:text-6xl font-bold font-headline rounded-full flex flex-col items-center justify-center
         shadow-lg transition-all duration-150 ease-in-out 
         active:scale-95 disabled:opacity-50`,
         isBuzzed 
            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        canBuzz && 'animate-pulse shadow-primary/50 shadow-2xl ring-4 ring-primary/50'
      )}
    >
      <Zap className="w-16 h-16 mb-4" />
      {buttonText}
    </Button>
  );
}
