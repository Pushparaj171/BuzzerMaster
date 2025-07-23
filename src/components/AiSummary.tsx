'use client';

import { useState } from 'react';
import { summarizePlayerPerformance } from '@/ai/flows/summarize-player-performance';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AiSummaryProps {
  sessionId: string;
  playerName: string;
  buzzingOrder: string[];
}

export function AiSummary({ sessionId, playerName, buzzingOrder }: AiSummaryProps) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary('');
    try {
      // In a real app, you would get the userId from your auth provider
      const result = await summarizePlayerPerformance({
        sessionId,
        playerName,
        buzzingOrder,
        alternativeChoices: [],
      });
      setSummary(result.summary);
    } catch (e) {
      toast({
        title: "Error Generating Summary",
        description: "There was a problem generating the AI summary. Please try again later.",
        variant: "destructive",
      })
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="font-headline">AI Performance Summary for {playerName}</DialogTitle>
        <DialogDescription>
          An AI-generated analysis of this player&apos;s performance in the session.
        </DialogDescription>
      </DialogHeader>
      <div className="py-6 text-center">
        {!summary && !isLoading && (
          <Button onClick={handleGenerateSummary}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Summary
          </Button>
        )}
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Generating analysis... This may take a moment.</span>
          </div>
        )}
        {summary && (
            <div className="p-4 bg-background rounded-lg text-left">
                <p className="whitespace-pre-wrap text-sm">{summary}</p>
            </div>
        )}
      </div>
    </div>
  );
}
