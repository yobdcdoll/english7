import { content, type Scene } from './content';
import { dayNumber } from './date';
import { selectCards } from './scheduler';
import type { AppState } from './types';

export type ChoiceOption = { id: string; emoji: string };

export type SessionItem =
  | {
      kind: 'intro';
      cardId: string;
      scene: Scene;
      indexInCard: number;
      totalInCard: number;
    }
  | {
      kind: 'choice';
      cardId: string;
      scene: Scene;
      options: ChoiceOption[];
      /** Only the first due-card answer of the day updates the scheduler. */
      counts: boolean;
      phase: 'recycle' | 'game';
    };

export type SessionPlan = {
  items: SessionItem[];
  newIds: string[];
  dueIds: string[];
};

function pickScene(cardId: string, salt: number, day: number): Scene {
  const chunk = content.chunks.find((c) => c.id === cardId);
  if (!chunk) throw new Error(`Unknown chunk: ${cardId}`);
  return chunk.scenes[(day + salt) % chunk.scenes.length];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeOptions(scene: Scene): ChoiceOption[] {
  const pool = content.chunks
    .flatMap((chunk) => chunk.scenes)
    .filter((candidate) => candidate.id !== scene.id && candidate.emoji !== scene.emoji);
  const distractors = shuffle(pool).slice(0, 2);
  return shuffle([
    { id: scene.id, emoji: scene.emoji },
    ...distractors.map((candidate) => ({ id: candidate.id, emoji: candidate.emoji })),
  ]);
}

export function planSummary(state: AppState, today: string): { newCount: number; dueCount: number } {
  const ids = content.chunks.map((chunk) => chunk.id);
  const selection = selectCards(ids, state.cards, today, {
    maxDue: 8,
    maxNew: 1,
    newPerWeek: state.settings.newPerWeek,
  });
  const dueCount =
    selection.dueIds.length > 0
      ? selection.dueIds.length
      : selection.newIds.length === 0
        ? 3
        : 0;
  return { newCount: selection.newIds.length, dueCount };
}

export function buildSession(state: AppState, today: string): SessionPlan {
  const ids = content.chunks.map((chunk) => chunk.id);
  const selection = selectCards(ids, state.cards, today, {
    maxDue: 8,
    maxNew: 1,
    newPerWeek: state.settings.newPerWeek,
  });
  const newIds = selection.newIds;
  let dueIds = selection.dueIds;

  // Keep the daily ritual alive on days with nothing due and nothing new.
  if (newIds.length === 0 && dueIds.length === 0) {
    dueIds = ids
      .filter((id) => (state.cards[id]?.box ?? 0) > 0)
      .sort((a, b) => (state.cards[a].nextDue ?? '').localeCompare(state.cards[b].nextDue ?? ''))
      .slice(0, 3);
  }

  const day = dayNumber(today);
  const items: SessionItem[] = [];

  // 1. Warm-up recycle: one listen-and-choose per due card (first 5).
  dueIds.slice(0, 5).forEach((cardId, index) => {
    const scene = pickScene(cardId, index, day);
    items.push({
      kind: 'choice',
      cardId,
      scene,
      options: makeOptions(scene),
      counts: true,
      phase: 'recycle',
    });
  });

  // 2. Introduce the new card through all of its scenes.
  newIds.forEach((cardId) => {
    const chunk = content.chunks.find((c) => c.id === cardId);
    if (!chunk) return;
    chunk.scenes.forEach((scene, index) => {
      items.push({
        kind: 'intro',
        cardId,
        scene,
        indexInCard: index,
        totalInCard: chunk.scenes.length,
      });
    });
  });

  // 3. Game recycle: new cards twice, due cards once, capped at 8.
  const gameItems: SessionItem[] = [];
  [...newIds, ...dueIds].forEach((cardId, index) => {
    const repeats = newIds.includes(cardId) ? 2 : 1;
    for (let round = 0; round < repeats; round += 1) {
      const scene = pickScene(cardId, index * 3 + round + 1, day);
      gameItems.push({
        kind: 'choice',
        cardId,
        scene,
        options: makeOptions(scene),
        counts: false,
        phase: 'game',
      });
    }
  });
  items.push(...gameItems.slice(0, 8));

  return { items, newIds, dueIds };
}
