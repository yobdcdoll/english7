import type { CardProgress } from './types';
import { addDays } from './date';

export const INTERVAL_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

export function newCard(id: string): CardProgress {
  return {
    id,
    box: 0,
    introducedOn: null,
    lastReviewed: null,
    nextDue: null,
    successDates: [],
    lapses: 0,
  };
}

export function introduceCard(card: CardProgress, today: string): CardProgress {
  return {
    ...card,
    box: 1,
    introducedOn: today,
    lastReviewed: today,
    nextDue: addDays(today, INTERVAL_DAYS[1]),
  };
}

export function answer(card: CardProgress, today: string, correct: boolean): CardProgress {
  if (!correct) {
    return {
      ...card,
      lapses: card.lapses + 1,
      lastReviewed: today,
      nextDue: addDays(today, 1),
    };
  }

  const box = Math.min(5, Math.max(1, card.box + 1));
  const successDates = card.successDates.includes(today)
    ? card.successDates
    : [...card.successDates, today];

  return {
    ...card,
    box,
    lastReviewed: today,
    nextDue: addDays(today, INTERVAL_DAYS[box]),
    successDates,
  };
}

export function isDue(card: CardProgress, today: string): boolean {
  return card.box > 0 && card.nextDue !== null && card.nextDue <= today;
}

export function isMastered(card: CardProgress): boolean {
  return card.successDates.length >= 3;
}

export type SelectionOptions = {
  maxDue: number;
  maxNew: number;
  newPerWeek: number;
};

export type Selection = {
  dueIds: string[];
  newIds: string[];
};

export function selectCards(
  ids: string[],
  progress: Record<string, CardProgress>,
  today: string,
  opts: SelectionOptions,
): Selection {
  const dueIds = ids
    .map((id) => progress[id])
    .filter((card): card is CardProgress => card !== undefined && isDue(card, today))
    .sort((a, b) => {
      const byDue = (a.nextDue ?? '').localeCompare(b.nextDue ?? '');
      return byDue !== 0 ? byDue : a.box - b.box;
    })
    .slice(0, opts.maxDue)
    .map((card) => card.id);

  const weekStart = addDays(today, -6);
  const introducedThisWeek = ids.filter((id) => {
    const introducedOn = progress[id]?.introducedOn;
    return introducedOn != null && introducedOn >= weekStart;
  }).length;

  const newIds =
    introducedThisWeek >= opts.newPerWeek
      ? []
      : ids.filter((id) => (progress[id]?.box ?? 0) === 0).slice(0, opts.maxNew);

  return { dueIds, newIds };
}
