export const VOTER_COOKIE: string;
export const VOTER_MAX_AGE: number;
export function issueVoterToken(secret: string, now?: number): string;
export function verifyVoterToken(token: unknown, secret: string, now?: number): string | null;
export function networkHash(headers: Headers, secret: string, options?: { vercel?: boolean; production?: boolean; now?: number }): string | null;
export function sameOriginVote(request: Request): boolean;
