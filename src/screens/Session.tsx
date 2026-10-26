import { useEffect, useRef, useState } from 'react';
import { speak } from '../lib/audio';
import { chunkById } from '../lib/content';
import { dateKey, formatDuration } from '../lib/date';
import { answer, introduceCard, newCard } from '../lib/scheduler';
import { buildSession } from '../lib/session';
import type { AppState, Mood, SessionItemRecord, SessionRecord } from '../lib/types';

type Props = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
};

export function Session({ state, setState, onExit }: Props) {
  const today = dateKey();
  const [plan] = useState(() => buildSession(state, today));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; chosen: string } | null>(null);
  const [answered, setAnswered] = useState<SessionItemRecord[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const counted = useRef(new Set<string>());
  const finished = useRef(false);

  const current = plan.items[index];

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!current) return;
    setFeedback(null);
    setShowHint(false);
    const timer = window.setTimeout(() => {
      void speak(current.scene.audioId, current.scene.utterance);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [current]);

  function choose(optionId: string) {
    if (!current || current.kind !== 'choice' || feedback) return;
    const correct = optionId === current.scene.id;
    setFeedback({ correct, chosen: optionId });
    setAnswered((prev) => [...prev, { cardId: current.cardId, phase: current.phase, correct }]);

    if (current.counts && !counted.current.has(current.cardId)) {
      counted.current.add(current.cardId);
      setState((prev) => {
        const card = prev.cards[current.cardId] ?? newCard(current.cardId);
        return {
          ...prev,
          cards: { ...prev.cards, [current.cardId]: answer(card, today, correct) },
        };
      });
    }

    if (!correct) {
      window.setTimeout(() => void speak(current.scene.audioId, current.scene.utterance), 350);
    }
  }

  function next() {
    if (current?.kind === 'intro' && current.indexInCard + 1 >= current.totalInCard) {
      const cardId = current.cardId;
      setState((prev) => {
        const card = prev.cards[cardId] ?? newCard(cardId);
        if (card.box > 0) return prev;
        return {
          ...prev,
          cards: { ...prev.cards, [cardId]: introduceCard(card, today) },
        };
      });
    }
    setFeedback(null);
    setIndex((value) => value + 1);
  }

  function finish(mood: Mood | null) {
    if (finished.current) return;
    finished.current = true;
    if (answered.length > 0 || plan.newIds.length > 0) {
      const record: SessionRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: today,
        startedAt,
        endedAt: Date.now(),
        items: answered,
        newCardIds: plan.newIds,
        mood,
        wasShort: Date.now() - startedAt < 120_000,
      };
      setState((prev) => ({ ...prev, sessions: [...prev.sessions, record] }));
    }
    onExit();
  }

  if (!current) {
    return (
      <div className="screen session-screen">
        <main className="wrap-main">
          <div className="big-emoji">🎉</div>
          <h1>今天完成了</h1>
          <p className="lead">
            {plan.newIds.length > 0
              ? `新学：${plan.newIds.map((id) => chunkById(id).chunk).join(' · ')}`
              : '今天只做回收，也很棒。'}
          </p>
          <div className="mood">
            <p>今天感觉怎么样？</p>
            <div className="mood-row">
              <button className="mood-btn" onClick={() => finish('happy')}>😄<span>开心</span></button>
              <button className="mood-btn" onClick={() => finish('ok')}>🙂<span>一般</span></button>
              <button className="mood-btn" onClick={() => finish('resistant')}>😕<span>抗拒</span></button>
            </div>
          </div>
          <button className="link" onClick={() => finish(null)}>直接完成</button>
        </main>
      </div>
    );
  }

  const progress = index / plan.items.length;

  return (
    <div className="screen session-screen">
      <header className="session-top">
        <button className="ghost" onClick={() => finish(null)}>结束</button>
        <div className="dots" aria-label="进度">
          {plan.items.map((item, i) => (
            <span
              key={`${item.cardId}-${i}`}
              className={`dot ${i < index ? 'done' : i === index ? 'current' : ''}`}
            />
          ))}
        </div>
        <span className="elapsed">{formatDuration(elapsed)}</span>
      </header>

      <main className="stage">
        {current.kind === 'intro' ? (
          <>
            <div className="scene-emoji">{current.scene.emoji}</div>
            <p className="utterance">{current.scene.utterance}</p>
            <button
              className="speaker"
              onClick={() => void speak(current.scene.audioId, current.scene.utterance)}
              aria-label="再听一遍"
            >
              🔊
            </button>
            <button className="hint-toggle" onClick={() => setShowHint((value) => !value)}>
              家长提示
            </button>
            {showHint && <p className="hint">{current.scene.promptZh}</p>}
            <button className="primary big" onClick={next}>
              {current.indexInCard + 1 < current.totalInCard ? '下一个' : '开始游戏'}
            </button>
          </>
        ) : (
          <>
            <p className="prompt">Listen. Choose.</p>
            <button
              className="speaker big-speaker"
              onClick={() => void speak(current.scene.audioId, current.scene.utterance)}
              aria-label="再听一遍"
            >
              🔊
            </button>
            <div className="options">
              {current.options.map((option) => {
                const isCorrect = option.id === current.scene.id;
                const isChosen = feedback?.chosen === option.id;
                const classes = [
                  'option',
                  feedback && isCorrect ? 'correct' : '',
                  feedback && isChosen && !isCorrect ? 'chosen-wrong' : '',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={option.id}
                    className={classes}
                    onClick={() => choose(option.id)}
                    disabled={Boolean(feedback)}
                  >
                    {option.emoji}
                  </button>
                );
              })}
            </div>
            {feedback && (
              <div className="feedback">
                <p className="small-utterance">{current.scene.utterance}</p>
                <p className={feedback.correct ? 'feedback-ok' : 'feedback-gentle'}>
                  {feedback.correct ? '✓' : '再听一遍'}
                </p>
                <button className="primary big" onClick={next}>下一个</button>
              </div>
            )}
          </>
        )}
      </main>

      <div className="progress-bar">
        <span style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
    </div>
  );
}
