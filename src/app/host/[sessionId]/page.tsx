'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PlayerList } from '@/components/PlayerList';
import type { Player } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clipboard, Play, RefreshCw, Home, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SESSION_DURATION = 120; // 2 minutes

export default function HostPage({ params: paramsPromise }: { params: Promise<{ sessionId: string }> }) {
  const params = use(paramsPromise);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const { toast } = useToast();

  const handleStartTimer = () => {
    if (players.length > 0) {
      setPlayers([]);
    }
    setIsTimerRunning(true);
    setIsTimerFinished(false);
    setStartTime(Date.now());
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    setPlayers([]);
  };

  const handleTimerEnd = () => {
    setIsTimerRunning(false);
    setIsTimerFinished(true);
  };
  
  const addMockPlayer = () => {
    if (!isTimerRunning) {
      toast({
        title: "Timer not running",
        description: "Please start the timer before adding mock players.",
        variant: "destructive"
      });
      return;
    }
    const mockPlayerName = `Player ${Math.floor(Math.random() * 100) + 1}`;
    const buzzedAt = Date.now() - startTime;
    setPlayers(prev => [...prev, { name: mockPlayerName, buzzedAt }].sort((a,b) => a.buzzedAt - b.buzzedAt));
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(params.sessionId);
    toast({
      title: "Copied to Clipboard!",
      description: `Session ID ${params.sessionId} is ready to be shared.`,
    });
  };

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
                <span className="font-mono text-2xl font-bold text-primary">{params.sessionId}</span>
            </div>
            <Button onClick={copySessionId} variant="outline" size="icon">
              <Clipboard className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Timer
                    duration={SESSION_DURATION}
                    isRunning={isTimerRunning}
                    onTimerEnd={handleTimerEnd}
                />
                <div className="flex gap-4">
                    <Button onClick={handleStartTimer} disabled={isTimerRunning} className="w-full font-bold">
                        <Play className="mr-2" /> Start Timer
                    </Button>
                    <Button onClick={handleResetTimer} variant="secondary" className="w-full font-bold">
                        <RefreshCw className="mr-2" /> Reset
                    </Button>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Users className="w-5 h-5"/> Participants</CardTitle>
                        <CardDescription>Simulate participants buzzing in for testing purposes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={addMockPlayer} variant="outline" className="w-full">
                            Simulate Player Buzz
                        </Button>
                        <p className="text-xs text-center mt-2 text-muted-foreground">
                            In a real session, participants will appear automatically.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <PlayerList 
                players={players} 
                isHost={true} 
                isTimerFinished={isTimerFinished} 
                sessionId={params.sessionId} 
            />
        </div>
      </main>
    </div>
  );
}
