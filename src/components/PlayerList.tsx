import type { Player } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Bot, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { AiSummary } from './AiSummary';

interface PlayerListProps {
  players: Player[];
  isHost: boolean;
  isTimerFinished: boolean;
  sessionId: string;
}

export function PlayerList({ players, isHost, isTimerFinished, sessionId }: PlayerListProps) {
    const buzzedPlayers = players.filter(p => p.buzzedAt > 0).sort((a, b) => a.buzzedAt - b.buzzedAt);
    const buzzingOrder = buzzedPlayers.map(p => p.name);

    if (isHost && !isTimerFinished) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Users className="text-primary" />
                        Players Joined
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Waiting for players to join...</p>
                    ) : (
                        <ul className="space-y-3">
                            {players.map((player, index) => (
                                <li
                                    key={`${player.name}-${index}`}
                                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                                >
                                    <span className="font-medium text-lg">{player.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        );
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Trophy className="text-primary" />
          Buzzer Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        {buzzedPlayers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No one has buzzed yet. Waiting for the first buzz!</p>
        ) : (
          <ol className="space-y-3">
            {buzzedPlayers.map((player, index) => (
              <li
                key={`${player.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {index + 1}
                  </span>
                  <span className="font-medium text-lg">{player.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-muted-foreground">
                    +{((player.buzzedAt) / 1000).toFixed(2)}s
                    </span>
                    {isHost && isTimerFinished && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="secondary">
                                    <Bot className="mr-2 h-4 w-4" />
                                    Summary
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <AiSummary
                                    sessionId={sessionId}
                                    playerName={player.name}
                                    buzzingOrder={buzzingOrder}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
