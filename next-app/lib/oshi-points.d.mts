export type OshiPointId = 'cast' | 'music' | 'dance' | 'action' | 'story' | 'direction' | 'visuals' | 'adaptation' | 'funny' | 'moving';
export type OshiPoint = { readonly id: OshiPointId; readonly ja: string; readonly en: string; readonly icon: string };
export const OSHI_POINTS: readonly OshiPoint[];
export const OSHI_MIN_PARTICIPANTS: number;
export function isOshiPoint(id: unknown): id is OshiPointId;
export function validOshiSelection(value: unknown): value is OshiPointId[];
export function isPlayId(value: unknown): value is string;
export type OshiResults = { participants: number; points: { id: OshiPointId; votes: number; support: number }[]; top: { id: OshiPointId; votes: number; support: number }[] };
export function summarizeOshiResults(rows?: { point_id: string; votes: number | string; participants: number | string }[]): OshiResults;
