'use client';

import { useState, useEffect, Suspense, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlayerList } from '@/components/PlayerList';
import type { Player } from '@/lib/types';
import { Buzzer } from '@/components/Buzzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, onValue, set, get, onDisconnect } from 'firebase/database';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const SESSION_DURATION = 120; // 2 minutes
const ClientTimer = dynamic(() => import('@/components/ClientTimer'), { ssr: false });

function SessionComponent({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const sessionId = params.sessionId;
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Anonymous';
  const { toast } = useToast();

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    const playerRef = ref(database, `sessions/${sessionId}/players/${playerName}`);

    let unsubscribe: () => void;

    const setupSession = async () => {
      try {
        const snapshot = await get(sessionRef);
        if (!snapshot.exists()) {
          toast({
            title: "Invalid Session ID",
            description: "This session does not exist. Redirecting to homepage.",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        await set(playerRef, { name: playerName, buzzedAt: -1 });
        onDisconnect(playerRef).remove();

        unsubscribe = onValue(sessionRef, (dataSnapshot) => {
          const data = dataSnapshot.val();
          if (data) {
            const running = data.isTimerRunning ?? false;
            const finished = data.isTimerFinished ?? false;

            if (running && !isTimerRunning) {
              toast({
                title: "Session Started!",
                description: "The host has started the timer. Get ready to buzz!",
              });
            }
            if (finished && !isTimerFinished) {
              toast({
                title: "Time's up!",
                description: "The round has ended.",
              });
            }

            setIsTimerRunning(running);
            setIsTimerFinished(finished);
            setStartTime(data.startTime ?? 0);

            const playerList: Player[] = data.players ? Object.values(data.players) : [];
            setPlayers(playerList);

            const self = playerList.find(p => p.name === playerName);
            setHasBuzzed(self ? self.buzzedAt > 0 : false);
          } else {
             toast({
                title: "Session Closed",
                description: "The host has closed the session.",
                variant: "destructive",
            });
            router.push('/');
          }
        });
      } catch (error) {
        console.error("Firebase error:", error);
        toast({
          title: "Error",
          description: "Could not connect to the session.",
          variant: "destructive",
        });
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    setupSession();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      onDisconnect(playerRef).cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, playerName, router, toast]);

  const handleBuzz = async () => {
    if (hasBuzzed || !isTimerRunning || isTimerFinished) return;

    const sessionSnapshot = await get(ref(database, `sessions/${sessionId}`));
    const session = sessionSnapshot.val();
    
    if(!session || !session.isTimerRunning || session.isTimerFinished) {
        toast({ title: "Too late!", description: "The round has already ended.", variant: "destructive" });
        return;
    }
    
    const buzzedAt = Date.now() - session.startTime;
    const playerBuzzedAtRef = ref(database, `sessions/${sessionId}/players/${playerName}/buzzedAt`);
    await set(playerBuzzedAtRef, buzzedAt);
    
    toast({
      title: "You've buzzed in!",
      description: `Your time: ${(buzzedAt / 1000).toFixed(2)}s`,
    });
  };

  const handleTimerEnd = () => {
    // This is controlled by the host
  };

  const buzzedPlayers = players.filter(p => p.buzzedAt > 0).sort((a,b) => a.buzzedAt - b.buzzedAt);
  
  if (loading) {
    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 font-body flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Joining session...</p>
        </div>
    );
  }

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
                    <ClientTimer
                        duration={SESSION_DURATION}
                        isRunning={isTimerRunning}
                        onTimerEnd={handleTimerEnd}
                        startTime={startTime}
                    />
                    <Buzzer onBuzz={handleBuzz} disabled={!isTimerRunning || isTimerFinished} isBuzzed={hasBuzzed} />
                </div>
                <PlayerList players={isTimerFinished ? buzzedPlayers : players} isHost={false} isTimerFinished={isTimerFinished} sessionId={sessionId} />
            </div>
        </main>
    </div>
  );
}

export default function SessionPage({ params: paramsPromise }: { params: Promise<{ sessionId: string }> }) {
    const params = use(paramsPromise);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background p-4 sm:p-8 font-body flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading session...</p>
            </div>
        }>
            <SessionComponent params={params} />
        </Suspense>
    )
}
