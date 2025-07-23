'use server';

import { z, defineAuth } from 'genkit';

export const SignedInAuthPolicy = defineAuth(
  {
    name: 'signed-in-auth-policy',
    inputSchema: z.object({ userId: z.string() }),
  },
  async (input) => {
    if (!input.userId) {
      throw new Error('User must be signed in');
    }
  }
);
