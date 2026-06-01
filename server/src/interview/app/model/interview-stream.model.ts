/**
 * Événements émis au fil de l'eau pendant un tour d'entretien (streaming).
 */
export type InterviewStreamEvent =
  | { type: 'transcript'; studentTranscript: string }
  | { type: 'chunk'; text: string; audioBase64: string }
  | { type: 'done' };
