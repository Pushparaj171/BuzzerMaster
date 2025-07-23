'use client';

import { useState, useEffect, Suspense, use } from 'react';
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
import { database } from '@/lib/firebase';
import { ref, onValue, set, get, child } from 'firebase/database';

const SESSION_DURATION = 120; // 2 minutes

function SessionComponent({ params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Anonymous';
  const { toast } = useToast();

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    const playerRef = ref(database, `sessions/${sessionId}/players/${playerName}`);
    set(playerRef, { name: playerName, buzzedAt: -1 });

    const sessionRef = ref(database, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if(data.isTimerRunning && !isTimerRunning) {
            toast({
                title: "Session Started!",
                description: "The host has started the timer. Get ready to buzz!",
            });
        }
        setIsTimerRunning(data.isTimerRunning);
        if(data.isTimerFinished && !isTimerFinished) {
            toast({
                title: "Time's up!",
                description: "The round has ended.",
            });
        }
        setIsTimerFinished(data.isTimerFinished);
        setStartTime(data.startTime);
        const playerList: Player[] = data.players ? Object.values(data.players) : [];
        playerList.sort((a,b) => a.buzzedAt - b.buzzedAt);
        setPlayers(playerList);

        const self = playerList.find(p => p.name === playerName);
        if(self && self.buzzedAt > 0) {
          setHasBuzzed(true);
        } else {
          // Reset buzz status if host resets the game
          setHasBuzzed(false);
        }
      }
    });

    return () => unsubscribe();

  }, [sessionId, playerName, toast, isTimerRunning, isTimerFinished]);

  const handleBuzz = async () => {
    if (hasBuzzed || !isTimerRunning || isTimerFinished) return;

    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `sessions/${sessionId}`));
    if(!snapshot.exists()) {
        toast({ title: "Error", description: "Session not found.", variant: "destructive" });
        return;
    }
    const session = snapshot.val();
    if(!session.isTimerRunning || session.isTimerFinished) {
        toast({ title: "Too late!", description: "The round has already ended.", variant: "destructive" });
        return;
    }
    
    const buzzedAt = Date.now() - session.startTime;
    const playerRef = ref(database, `sessions/${sessionId}/players/${playerName}/buzzedAt`);
    set(playerRef, buzzedAt);
    setHasBuzzed(true);

    toast({
      title: "You've buzzed in!",
      description: `Your time: ${(buzzedAt / 1000).toFixed(2)}s`,
    });
  };

  const handleTimerEnd = () => {
    // This is now controlled by the host
  };

  const buzzedPlayers = players.filter(p => p.buzzedAt > 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body">
        <header className="flex justify-between items-center mb-8">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
                <Home className="w-6 h-6" /> 
                <span>BuzzMaster</span>
            </Link>
            <div className="text-right">
                <p className="font-semibold text-lg">{playerName}</p>
                <p className="text-sm text-muted-foreground">Session: {sessionId}</p>
            </div>
        </header>
        <main className="max-w-4xl mx-auto space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <Timer
                        duration={SESSION_DURATION}
                        isRunning={isTimerRunning}
                        onTimerEnd={handleTimerEnd}
                        startTime={startTime}
                    />
                    <Buzzer onBuzz={handleBuzz} disabled={!isTimerRunning || isTimerFinished} isBuzzed={hasBuzzed} />
                </div>
                <PlayerList players={buzzedPlayers} isHost={false} isTimerFinished={isTimerFinished} sessionId={sessionId} />
            </div>
        </main>
    </div>
  );
}

export default function SessionPage({ params: paramsPromise }: { params: Promise<{ sessionId: string }> }) {
    const params = use(paramsPromise);
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SessionComponent params={params} />
        </Suspense>
    )
}
