'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PlayerList } from '@/components/PlayerList';
import type { Player } from '@/lib/types';
import { Buzzer } from '@/components/Buzzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SESSION_DURATION = 120; // 2 minutes

function SessionComponent({ params }: { params: { sessionId: string } }) {
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Anonymous';
  const { toast } = useToast();

  // MOCK DATA and STATE - In a real app, this would come from a backend like Firebase.
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [startTime, setStartTime] = useState(0);

  // Mock starting the timer after a short delay to simulate connecting
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimerRunning(true);
      setStartTime(Date.now());
      toast({
        title: "Session Started!",
        description: "The host has started the timer. Get ready to buzz!",
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleBuzz = () => {
    if (hasBuzzed || !isTimerRunning) return;
    
    const buzzedAt = Date.now() - startTime;
    const self: Player = { name: playerName, buzzedAt };

    setPlayers(prev => [...prev, self].sort((a,b) => a.buzzedAt - b.buzzedAt));
    setHasBuzzed(true);

    toast({
      title: "You've buzzed in!",
      description: `Your time: ${(buzzedAt / 1000).toFixed(2)}s`,
    });
  };

  const handleTimerEnd = () => {
    setIsTimerRunning(false);
    setIsTimerFinished(true);
    toast({
        title: "Time's up!",
        description: "The round has ended.",
      });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body">
        <header className="flex justify-between items-center mb-8">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
                <Home className="w-6 h-6" /> 
                <span>BuzzMaster</span>
            </Link>
            <div className="text-right">
                <p className="font-semibold text-lg">{playerName}</p>
                <p className="text-sm text-muted-foreground">Session: {params.sessionId}</p>
            </div>
        </header>
        <main className="max-w-4xl mx-auto space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <Timer
                        duration={SESSION_DURATION}
                        isRunning={isTimerRunning}
                        onTimerEnd={handleTimerEnd}
                    />
                    <Buzzer onBuzz={handleBuzz} disabled={!isTimerRunning || isTimerFinished} isBuzzed={hasBuzzed} />
                </div>
                <PlayerList players={players} isHost={false} isTimerFinished={isTimerFinished} sessionId={params.sessionId} />
            </div>
        </main>
    </div>
  );
}

export default function SessionPage({ params }: { params: { sessionId: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SessionComponent params={params} />
        </Suspense>
    )
}
