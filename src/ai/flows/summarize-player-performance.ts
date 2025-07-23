'use server';

/**
 * @fileOverview Summarizes player performance using generative AI.
 *
 * - summarizePlayerPerformance - A function that summarizes player performance and suggests improvements.
 * - SummarizePlayerPerformanceInput - The input type for the summarizePlayerPerformance function.
 * - SummarizePlayerPerformanceOutput - The return type for the summarizePlayerPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePlayerPerformanceInputSchema = z.object({
  sessionId: z.string().describe('The ID of the buzzer game session.'),
  playerName: z.string().describe('The name of the player.'),
  buzzingOrder: z.array(z.string()).describe('The order in which the player buzzed during the session.'),
  alternativeChoices: z.array(z.string()).describe('The choices the player did not pick.'),
});
export type SummarizePlayerPerformanceInput = z.infer<typeof SummarizePlayerPerformanceInputSchema>;

const SummarizePlayerPerformanceOutputSchema = z.object({
  summary: z.string().describe('A summary of the player performance, including areas for improvement.'),
});
export type SummarizePlayerPerformanceOutput = z.infer<typeof SummarizePlayerPerformanceOutputSchema>;

export async function summarizePlayerPerformance(input: SummarizePlayerPerformanceInput): Promise<SummarizePlayerPerformanceOutput> {
  return summarizePlayerPerformanceFlow(input);
}

const summarizePlayerPerformancePrompt = ai.definePrompt({
  name: 'summarizePlayerPerformancePrompt',
  input: {schema: SummarizePlayerPerformanceInputSchema},
  output: {schema: SummarizePlayerPerformanceOutputSchema},
  prompt: `You are an AI game analyst providing feedback to a player after a buzzer game session.

  Summarize the player's performance based on the following information:

  Session ID: {{{sessionId}}}
  Player Name: {{{playerName}}}
  Buzzing Order: {{#if buzzingOrder}}{{#each buzzingOrder}}- {{{this}}}{{/each}}{{else}}None{{/if}}
  Alternative Choices: {{#if alternativeChoices}}{{#each alternativeChoices}}- {{{this}}}{{/each}}{{else}}None{{/if}}

  Provide a summary of their performance, highlighting strengths and areas for improvement. Suggest alternative choices they could have made and how it might have impacted their score. Conclude with actionable steps for the player to improve their buzzer game strategy next time.
`,
});

const summarizePlayerPerformanceFlow = ai.defineFlow(
  {
    name: 'summarizePlayerPerformanceFlow',
    inputSchema: SummarizePlayerPerformanceInputSchema,
    outputSchema: SummarizePlayerPerformanceOutputSchema,
  },
  async input => {
    const {output} = await summarizePlayerPerformancePrompt(input);
    return output!;
  }
);
