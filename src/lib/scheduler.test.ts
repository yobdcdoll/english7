import { describe, expect, it } from 'vitest';
import {
  answer,
  introduceCard,
  isDue,
  isMastered,
  newCard,
  selectCards,
} from './scheduler';

const DAY1 = '2026-10-26';

describe('scheduler', () => {
  it('introduces a card and schedules the first review for tomorrow', () => {
    const card = introduceCard(newCard('a'), DAY1);
    expect(card.box).toBe(1);
    expect(card.nextDue).toBe('2026-10-27');
    expect(card.successDates).toEqual([]);
  });

  it('advances the box and uses 1/2/4/7/14 day intervals', () => {
    let card = introduceCard(newCard('a'), DAY1);
    card = answer(card, '2026-10-27', true);
    expect(card.box).toBe(2);
    expect(card.nextDue).toBe('2026-10-29');

    card = answer(card, '2026-10-29', true);
    expect(card.box).toBe(3);
    expect(card.nextDue).toBe('2026-11-02');

    card = answer(card, '2026-11-02', true);
    expect(card.box).toBe(4);
    expect(card.nextDue).toBe('2026-11-09');
    expect(isMastered(card)).toBe(true);
  });

  it('keeps the box on a wrong answer and retries tomorrow', () => {
    const introduced = introduceCard(newCard('a'), DAY1);
    const card = answer(introduced, '2026-10-27', false);
    expect(card.box).toBe(1);
    expect(card.nextDue).toBe('2026-10-28');
    expect(card.lapses).toBe(1);
    expect(card.successDates).toEqual([]);
  });

  it('counts a success only once per day', () => {
    let card = introduceCard(newCard('a'), DAY1);
    card = answer(card, '2026-10-27', true);
    card = answer(card, '2026-10-27', true);
    expect(card.successDates).toEqual(['2026-10-27']);
  });

  it('is due only on or after its next due date', () => {
    const card = introduceCard(newCard('a'), DAY1);
    expect(isDue(card, '2026-10-26')).toBe(false);
    expect(isDue(card, '2026-10-27')).toBe(true);
    expect(isDue(card, '2026-10-30')).toBe(true);
  });

  it('picks the most overdue cards first and respects the new-per-week cap', () => {
    const progress = {
      a: answer(introduceCard(newCard('a'), '2026-10-20'), '2026-10-21', true),
      b: introduceCard(newCard('b'), '2026-10-18'),
      c: introduceCard(newCard('c'), '2026-10-18'),
    };
    // a is due 2026-10-23, b/c are due 2026-10-19
    const selection = selectCards(['a', 'b', 'c', 'd', 'e'], progress, DAY1, {
      maxDue: 2,
      maxNew: 1,
      newPerWeek: 1,
    });
    expect(selection.dueIds).toEqual(['b', 'c']);
    expect(selection.newIds).toEqual([]);
  });

  it('introduces one new card when the weekly budget allows it', () => {
    const selection = selectCards(['a', 'b', 'c', 'd'], {}, DAY1, {
      maxDue: 5,
      maxNew: 1,
      newPerWeek: 3,
    });
    expect(selection.newIds).toEqual(['a']);
  });
});
