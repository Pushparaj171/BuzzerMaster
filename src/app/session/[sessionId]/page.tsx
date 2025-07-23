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
import { ref, onValue, set, get, child, onDisconnect } from 'firebase/database';
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
    
    get(sessionRef).then((snapshot) => {
      if (!snapshot.exists()) {
        toast({
          title: "Invalid Session ID",
          description: "This session does not exist. Please check the ID and try again.",
          variant: "destructive",
        });
        router.push('/');
        return;
      }
      setLoading(false);

      const playerRef = ref(database, `sessions/${sessionId}/players/${playerName}`);
      set(playerRef, { name: playerName, buzzedAt: -1 });
      onDisconnect(playerRef).remove();

      const unsubscribe = onValue(sessionRef, (dataSnapshot) => {
        const data = dataSnapshot.val();
        if (data) {
          if (data.isTimerRunning && !isTimerRunning) {
            toast({
              title: "Session Started!",
              description: "The host has started the timer. Get ready to buzz!",
            });
          }
          setIsTimerRunning(data.isTimerRunning);
          if (data.isTimerFinished && !isTimerFinished) {
            toast({
              title: "Time's up!",
              description: "The round has ended.",
            });
          }
          setIsTimerFinished(data.isTimerFinished);
          setStartTime(data.startTime);
          const playerList: Player[] = data.players ? Object.values(data.players) : [];
          setPlayers(playerList);

          const self = playerList.find(p => p.name === playerName);
          if (self && self.buzzedAt > 0) {
            setHasBuzzed(true);
          } else {
            setHasBuzzed(false);
          }
        } else {
           toast({
              title: "Session Closed",
              description: "The host has closed the session.",
              variant: "destructive",
          });
          router.push('/');
        }
      });
      
      return () => unsubscribe();
    });

  }, [sessionId, playerName, toast, router, isTimerRunning, isTimerFinished]);

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
  
  if (loading) {
    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 font-body flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating session...</p>
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
                <PlayerList players={buzzedPlayers} isHost={false} isTimerFinished={isTimerFinished} sessionId={sessionId} />
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
