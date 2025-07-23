'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Users } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleHostSession = () => {
    const newSessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/host/${newSessionId}`);
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId && playerName) {
      router.push(`/session/${sessionId.toUpperCase()}?name=${encodeURIComponent(playerName)}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background font-body">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary tracking-tighter">BuzzMaster</h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-2 max-w-2xl">
          The ultimate real-time buzzer app for your quizzes and games. Host a session, share the ID, and see who's the fastest on the draw.
        </p>
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Host a Session</CardTitle>
                <CardDescription>Create a new room and invite your friends.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={handleHostSession} className="w-full text-lg py-6 font-bold">
              Create New Session
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Join a Session</CardTitle>
                <CardDescription>Enter a session ID and your name to join.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName" className="font-semibold">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="e.g. Jane Doe"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  className="py-6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionId" className="font-semibold">Session ID</Label>
                <Input
                  id="sessionId"
                  placeholder="e.g. XYZ123"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  required
                  className="py-6"
                />
              </div>
              <Button type="submit" className="w-full text-lg py-6 font-bold" variant="secondary">
                Join Session
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
