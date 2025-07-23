'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayerList } from '@/components/PlayerList';
import type { Player } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clipboard, Play, RefreshCw, Home, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import dynamic from 'next/dynamic';

const SESSION_DURATION = 120; // 2 minutes

const ClientTimer = dynamic(() => import('@/components/ClientTimer'), { ssr: false });

export default function HostPage({ params: paramsPromise }: { params: Promise<{ sessionId: string }> }) {
  const params = use(paramsPromise);
  const sessionId = params.sessionId;
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playerList: Player[] = data.players ? Object.values(data.players) : [];
        setPlayers(playerList);
        setIsTimerRunning(data.isTimerRunning);
        setIsTimerFinished(data.isTimerFinished);
        setStartTime(data.startTime);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleStartTimer = () => {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    const newStartTime = Date.now();
    set(sessionRef, {
      startTime: newStartTime,
      isTimerRunning: true,
      isTimerFinished: false,
      players: players.reduce((acc, player) => {
        acc[player.name] = { name: player.name, buzzedAt: -1 };
        return acc;
        }, {} as Record<string, Player>)
    });
  };

  const handleResetTimer = () => {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    remove(sessionRef).then(() => {
      setPlayers([]);
      setIsTimerRunning(false);
      setIsTimerFinished(false);
      setStartTime(0);
    });
  };

  const handleTimerEnd = () => {
    const sessionRef = ref(database, `sessions/${sessionId}/isTimerFinished`);
    set(sessionRef, true);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast({
      title: "Copied to Clipboard!",
      description: `Session ID ${sessionId} is ready to be shared.`,
    });
  };

  const buzzedPlayers = players.filter(p => p.buzzedAt > 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
            <Home className="w-6 h-6" /> 
            <span>BuzzMaster</span>
        </Link>
      </header>
      <main className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Host Dashboard</CardTitle>
            <CardDescription>
                Manage your BuzzMaster session. Share the ID with participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="p-4 bg-muted rounded-lg flex items-center gap-4">
                <span className="font-semibold text-muted-foreground">Session ID:</span>
                <span className="font-mono text-2xl font-bold text-primary">{sessionId}</span>
            </div>
            <Button onClick={copySessionId} variant="outline" size="icon">
              <Clipboard className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <ClientTimer
                    duration={SESSION_DURATION}
                    isRunning={isTimerRunning}
                    onTimerEnd={handleTimerEnd}
                    startTime={startTime}
                />
                <div className="flex gap-4">
                    <Button onClick={handleStartTimer} disabled={isTimerRunning || players.length === 0} className="w-full font-bold">
                        <Play className="mr-2" /> Start Timer
                    </Button>
                    <Button onClick={handleResetTimer} variant="secondary" className="w-full font-bold">
                        <RefreshCw className="mr-2" /> Reset
                    </Button>
                </div>
            </div>

            <PlayerList 
                players={isTimerFinished ? buzzedPlayers : players} 
                isHost={true} 
                isTimerFinished={isTimerRunning && isTimerFinished} 
                sessionId={sessionId} 
            />
        </div>
      </main>
    </div>
  );
}
