import { dateKey, formatDateZh } from '../lib/date';
import { planSummary } from '../lib/session';
import type { AppState } from '../lib/types';

type Props = {
  state: AppState;
  onStart: () => void;
  onBaseline: () => void;
  onParent: () => void;
};

export function Home({ state, onStart, onBaseline, onParent }: Props) {
  const today = dateKey();
  const summary = planSummary(state, today);

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">English 7</div>
        <button className="ghost" onClick={onParent}>家长</button>
      </header>

      <main className="home-main">
        <p className="eyebrow">{formatDateZh(today)}{state.childName ? ` · ${state.childName}` : ''}</p>
        <h1>Ready?</h1>
        <p className="lead">20 分钟。你只要陪着，跟着屏幕走。</p>

        <div className="plan-card">
          <div className="plan-stat">
            <span className="plan-num">{summary.newCount}</span>
            <span className="plan-label">个新语块</span>
          </div>
          <div className="plan-divider" />
          <div className="plan-stat">
            <span className="plan-num">{summary.dueCount}</span>
            <span className="plan-label">个回收</span>
          </div>
        </div>

        <button className="primary big" onClick={onStart}>开始今天</button>

        {!state.baseline ? (
          <button className="secondary-card" onClick={onBaseline}>
            <strong>先做一次基线测</strong>
            <span>约 15 分钟，家长主持。测完再开始，起点更准。</span>
          </button>
        ) : (
          <button className="link" onClick={onBaseline}>重做基线测</button>
        )}

        <p className="footnote">最低 2 分钟也算完成。不催、不补、不延长。</p>
      </main>
    </div>
  );
}
