'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SignedInAuthPolicy = ai.defineAuth(
  {
    name: 'signed-in-auth-policy',
    inputSchema: z.object({userId: z.string()}),
  },
  async input => {
    if (!input.userId) {
      throw new Error('User must be signed in');
    }
  }
);
