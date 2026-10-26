export type Mood = 'happy' | 'ok' | 'resistant';

export type Dimension = 'comprehension' | 'listening' | 'decoding' | 'production';

export type CardProgress = {
  id: string;
  /** 0 = not introduced, 1..5 = Leitner box */
  box: number;
  introducedOn: string | null;
  lastReviewed: string | null;
  nextDue: string | null;
  /** Distinct local dates with a correct answer. Three dates = mastered. */
  successDates: string[];
  lapses: number;
};

export type SessionItemRecord = {
  cardId: string;
  phase: 'recycle' | 'new' | 'game';
  correct: boolean;
};

export type SessionRecord = {
  id: string;
  date: string;
  startedAt: number;
  endedAt: number;
  items: SessionItemRecord[];
  newCardIds: string[];
  mood: Mood | null;
  wasShort: boolean;
};

export type DimensionResult = {
  correct: number;
  total: number;
  answered: number;
  stopped: boolean;
};

export type BaselineResult = {
  date: string;
  dimensions: Record<Dimension, DimensionResult>;
  productionNotes: string[];
};

export type AppState = {
  version: 1;
  childName: string;
  settings: {
    newPerWeek: number;
    theme: 'default' | 'pokemon';
  };
  cards: Record<string, CardProgress>;
  sessions: SessionRecord[];
  baseline: BaselineResult | null;
};
