'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TimerProps {
  duration: number; // in seconds
  isRunning: boolean;
  onTimerEnd: () => void;
  onTimeUpdate?: (timeLeft: number) => void;
  startTime?: number;
}

export default function ClientTimer({ duration, isRunning, onTimerEnd, onTimeUpdate, startTime = 0 }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isRunning) {
      // If the timer is not running, reset to the initial duration.
      setTimeLeft(duration);
      return;
    }
    
    // Do nothing if the timer is supposed to be running but there's no start time.
    if(!startTime) return;

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const newTimeLeft = duration - elapsed;

      if (newTimeLeft <= 0) {
        setTimeLeft(0);
        onTimerEnd();
        clearInterval(intervalId);
      } else {
        setTimeLeft(newTimeLeft);
        onTimeUpdate?.(newTimeLeft);
      }
    }, 1000);

    // Cleanup interval on component unmount or when dependencies change.
    return () => clearInterval(intervalId);
  }, [isRunning, duration, onTimerEnd, onTimeUpdate, startTime]);
  
  // An additional effect to reset the timer display when isRunning becomes false.
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration);
    }
  }, [isRunning, duration]);


  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card className="text-center bg-card shadow-md">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground font-semibold">Time Remaining</p>
        <div className="text-6xl font-bold font-mono tracking-tighter text-primary">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </CardContent>
    </Card>
  );
}
