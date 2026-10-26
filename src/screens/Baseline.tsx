import { useEffect, useState } from 'react';
import { speak } from '../lib/audio';
import { content } from '../lib/content';
import { dateKey, formatDateZh } from '../lib/date';
import type { AppState, BaselineResult, Dimension, DimensionResult } from '../lib/types';

const DIMS: Dimension[] = ['comprehension', 'listening', 'decoding', 'production'];

const DIM_LABEL: Record<Dimension, string> = {
  comprehension: '理解',
  listening: '听辨',
  decoding: '解码',
  production: '产出',
};

const DIM_INSTRUCTION: Record<Dimension, string> = {
  comprehension: '听到句子，让孩子从三张图里选。孩子点图，你判断；没反应就点“没反应”。',
  listening: '播放句子，让孩子跟着说。你只判断像不像，不纠正。',
  decoding: '让孩子读出屏幕上的词。读不出也没关系。',
  production: '指着图问 What\'s this? 看孩子会不会主动说。不提示、不纠正。',
};

function zero(): DimensionResult {
  return { correct: 0, total: 0, answered: 0, stopped: false };
}

type Props = {
  speechRate: number;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
};

export function Baseline({ speechRate, setState, onExit }: Props) {
  const [phase, setPhase] = useState<'start' | 'item' | 'result'>('start');
  const [dimIndex, setDimIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [result, setResult] = useState<Record<Dimension, DimensionResult>>({
    comprehension: zero(),
    listening: zero(),
    decoding: zero(),
    production: zero(),
  });
  const [misses, setMisses] = useState(0);
  const [recorded, setRecorded] = useState<null | 'correct' | 'incorrect' | 'none'>(null);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);

  const dim = DIMS[dimIndex];

  useEffect(() => {
    if (phase !== 'item') return;
    const item = content.baseline[dim][itemIndex] as unknown as {
      utterance?: string;
      audioId?: string;
    };
    if (!item.audioId || !item.utterance) return;
    const timer = window.setTimeout(() => {
      void speak(item.audioId as string, item.utterance as string, speechRate);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [phase, dim, itemIndex, speechRate]);

  function record(value: 'correct' | 'incorrect' | 'none') {
    if (recorded) return;
    setRecorded(value);
    setResult((prev) => ({
      ...prev,
      [dim]: {
        ...prev[dim],
        correct: prev[dim].correct + (value === 'correct' ? 1 : 0),
        total: prev[dim].total + 1,
        answered: prev[dim].answered + 1,
      },
    }));
    setMisses((prev) => (value === 'correct' ? 0 : prev + 1));
  }

  function advanceDimension() {
    if (dimIndex + 1 >= DIMS.length) {
      setPhase('result');
      return;
    }
    setDimIndex((value) => value + 1);
    setItemIndex(0);
    setMisses(0);
    setRecorded(null);
  }

  function next() {
    if (!recorded) return;
    if (dim === 'production' && note.trim()) {
      setNotes((prev) => [...prev, note.trim()]);
    }
    setNote('');

    const total = content.baseline[dim].length;
    const shouldStop = dim !== 'production' && misses >= 3;

    if (shouldStop) {
      setResult((prev) => ({
        ...prev,
        [dim]: { ...prev[dim], stopped: true },
      }));
      advanceDimension();
      return;
    }

    if (itemIndex + 1 >= total) {
      advanceDimension();
      return;
    }

    setItemIndex((value) => value + 1);
    setRecorded(null);
  }

  const compRatio =
    result.comprehension.answered > 0
      ? result.comprehension.correct / result.comprehension.answered
      : 0;
  const recommended = compRatio <= 0.3 ? 2 : 3;

  function finish() {
    const baseline: BaselineResult = {
      date: dateKey(),
      dimensions: result,
      productionNotes: notes,
    };
    setState((prev) => ({
      ...prev,
      baseline,
      settings: { ...prev.settings, newPerWeek: recommended },
    }));
    onExit();
  }

  if (phase === 'start') {
    return (
      <div className="screen baseline-screen">
        <header className="topbar">
          <button className="ghost" onClick={onExit}>退出</button>
          <div className="brand small-brand">基线测</div>
          <span />
        </header>
        <main className="baseline-main">
          <p className="eyebrow">家长主持</p>
          <h1>先看一眼起点</h1>
          <p className="lead">这不是考试。孩子只负责听、指、读，你负责点按钮。</p>
          <ul className="baseline-list">
            <li><strong>理解</strong>：听到句子，从三张图里选</li>
            <li><strong>听辨</strong>：听到句子，跟着说</li>
            <li><strong>解码</strong>：看到词，读出来</li>
            <li><strong>产出</strong>：看图，试着说</li>
          </ul>
          <p className="muted">大约 15 分钟，建议一次做完。结果只给你看，不给孩子打分。</p>
          <button className="primary big" onClick={() => setPhase('item')}>开始</button>
        </main>
      </div>
    );
  }

  if (phase === 'result') {
    const dimensionLine = (target: Dimension) => {
      const r = result[target];
      return target === 'production'
        ? `${r.correct}/${r.answered} 次开口`
        : `${r.correct}/${r.answered}`;
    };

    const dimensionLabel = (target: Dimension) => {
      const r = result[target];
      const ratio = r.answered > 0 ? r.correct / r.answered : 0;
      if (target === 'comprehension') {
        return ratio < 0.34 ? '几乎听不辨' : ratio < 0.67 ? '零星能懂' : '基础指令能懂';
      }
      if (target === 'listening') {
        return ratio < 0.5 ? '跟读困难' : ratio < 0.8 ? '能跟读短句' : '跟读顺畅';
      }
      if (target === 'decoding') {
        return ratio < 0.34 ? '还不能解码' : ratio < 0.67 ? '部分能读' : '能读但不一定懂';
      }
      return r.correct === 0 ? '还没有主动开口' : '愿意开口';
    };

    return (
      <div className="screen baseline-screen">
        <main className="baseline-main result-main">
          <p className="eyebrow">基线测 · {formatDateZh(dateKey())}</p>
          <h1>起点档案</h1>
          <p className="lead">这张结果只给家长看，不给孩子打分。</p>

          <div className="result-grid">
            {DIMS.map((target) => (
              <div key={target} className="result-row">
                <div>
                  <strong>{DIM_LABEL[target]}</strong>
                  <div className="muted small">{dimensionLabel(target)}</div>
                </div>
                <span className="result-value">{dimensionLine(target)}</span>
                {result[target].stopped && <span className="tag">提前停止</span>}
              </div>
            ))}
          </div>

          <p className="recommend">
            建议每周 <strong>{recommended}</strong> 个新语块。
            {recommended === 2
              ? '先慢一点，把每天 20 分钟的仪式稳住。'
              : '按标准节奏走，重点放在理解和回收。'}
          </p>

          <button className="primary big" onClick={finish}>保存并返回</button>
        </main>
      </div>
    );
  }

  const total = content.baseline[dim].length;

  return (
    <div className="screen baseline-screen">
      <header className="topbar">
        <button className="ghost" onClick={onExit}>退出</button>
        <div className="dim-progress">{DIM_LABEL[dim]} · {itemIndex + 1}/{total}</div>
        <span className="muted small">{dimIndex + 1}/4</span>
      </header>

      <main className="baseline-main">
        <p className="instruction">{DIM_INSTRUCTION[dim]}</p>

        {dim === 'comprehension' && (() => {
          const item = content.baseline.comprehension[itemIndex];
          return (
            <>
              <button
                className="speaker big-speaker"
                onClick={() => void speak(item.audioId, item.utterance, speechRate)}
                aria-label="再听一遍"
              >
                🔊
              </button>
              <div className="options">
                {item.options.map((option) => (
                  <button
                    key={option.id}
                    className="option"
                    onClick={() => record(option.id === item.answer ? 'correct' : 'incorrect')}
                    disabled={Boolean(recorded)}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
              <button className="ghost" onClick={() => record('none')} disabled={Boolean(recorded)}>
                没反应
              </button>
              {recorded && <p className="small-utterance">{item.utterance}</p>}
            </>
          );
        })()}

        {dim === 'listening' && (() => {
          const item = content.baseline.listening[itemIndex];
          return (
            <>
              <button
                className="speaker big-speaker"
                onClick={() => void speak(item.audioId, item.utterance, speechRate)}
                aria-label="再听一遍"
              >
                🔊
              </button>
              <div className="parent-actions">
                <button className="choice-btn" onClick={() => record('correct')} disabled={Boolean(recorded)}>像</button>
                <button className="choice-btn" onClick={() => record('incorrect')} disabled={Boolean(recorded)}>不像</button>
                <button className="choice-btn ghost" onClick={() => record('none')} disabled={Boolean(recorded)}>没开口</button>
              </div>
              {recorded && <p className="small-utterance">{item.utterance}</p>}
            </>
          );
        })()}

        {dim === 'decoding' && (() => {
          const item = content.baseline.decoding[itemIndex];
          return (
            <>
              <p className="word-xl">{item.display}</p>
              <div className="parent-actions">
                <button className="choice-btn" onClick={() => record('correct')} disabled={Boolean(recorded)}>读对</button>
                <button className="choice-btn" onClick={() => record('incorrect')} disabled={Boolean(recorded)}>读错</button>
                <button className="choice-btn ghost" onClick={() => record('none')} disabled={Boolean(recorded)}>没读</button>
              </div>
            </>
          );
        })()}

        {dim === 'production' && (() => {
          const item = content.baseline.production[itemIndex];
          return (
            <>
              <div className="scene-emoji">{item.emoji}</div>
              <button
                className="speaker"
                onClick={() => void speak(item.audioId, item.utterance, speechRate)}
                aria-label="再听一遍"
              >
                🔊
              </button>
              <div className="parent-actions">
                <button className="choice-btn" onClick={() => record('correct')} disabled={Boolean(recorded)}>开口了</button>
                <button className="choice-btn ghost" onClick={() => record('none')} disabled={Boolean(recorded)}>没开口</button>
              </div>
              {recorded && (
                <input
                  className="note-input"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="他/她说了什么（可选）"
                />
              )}
            </>
          );
        })()}

        {recorded && (
          <div className="baseline-next">
            <span className="recorded">已记录</span>
            <button className="primary" onClick={next}>下一个</button>
          </div>
        )}
      </main>
    </div>
  );
}
