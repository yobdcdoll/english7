import { content } from '../lib/content';
import { dateKey, formatDateZh, formatDuration } from '../lib/date';
import { isMastered, newCard } from '../lib/scheduler';
import { emptyState } from '../lib/storage';
import type { AppState, Dimension, Mood } from '../lib/types';

const DIMS: Dimension[] = ['comprehension', 'listening', 'decoding', 'production'];

const DIM_LABEL: Record<Dimension, string> = {
  comprehension: '理解',
  listening: '听辨',
  decoding: '解码',
  production: '产出',
};

const MOOD_LABEL: Record<Mood, string> = {
  happy: '开心',
  ok: '一般',
  resistant: '抗拒',
};

function moodLabel(mood: Mood | null): string {
  return mood ? MOOD_LABEL[mood] : '未记录';
}

type Props = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onBack: () => void;
};

export function ParentPanel({ state, setState, onBack }: Props) {
  const today = dateKey();

  const todaySessions = state.sessions.filter((session) => session.date === today);
  const totalAnswered = todaySessions.reduce((sum, session) => sum + session.items.length, 0);
  const totalCorrect = todaySessions.reduce(
    (sum, session) => sum + session.items.filter((item) => item.correct).length,
    0,
  );
  const totalDuration = todaySessions.reduce(
    (sum, session) => sum + (session.endedAt - session.startedAt),
    0,
  );
  const anyShort = todaySessions.some((session) => session.wasShort);
  const latestMood =
    [...todaySessions]
      .sort((a, b) => b.endedAt - a.endedAt)
      .find((session) => session.mood !== null)?.mood ?? null;

  const recentSessions = [...state.sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, 10);

  function updateChildName(value: string) {
    setState((prev) => ({ ...prev, childName: value }));
  }

  function updateNewPerWeek(value: number) {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, newPerWeek: value },
    }));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `english7-${dateKey()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resetData() {
    const confirmed = window.confirm(
      '确定清空所有学习记录吗？\n\n会删除语块进度、每日记录和基线结果，且无法恢复。孩子昵称和设置会保留。',
    );
    if (!confirmed) return;

    setState((prev) => {
      const base = emptyState();
      return {
        ...base,
        childName: prev.childName,
        settings: prev.settings,
      };
    });
  }

  return (
    <div className="screen parent-screen">
      <header className="topbar">
        <button className="ghost" onClick={onBack}>返回</button>
        <div className="brand small-brand">家长面板</div>
        <span />
      </header>

      <main className="panel-main">
        <p className="eyebrow">只给家长看</p>

        <section className="section">
          <h2 className="section-title">今日报告</h2>
          {todaySessions.length === 0 ? (
            <p className="muted">今天还没有记录</p>
          ) : (
            <div className="report-grid">
              <div className="stat">
                <span className="stat-value">{todaySessions.length}</span>
                <span className="stat-label">完成次数</span>
              </div>
              <div className="stat">
                <span className="stat-value">{totalAnswered}</span>
                <span className="stat-label">答题数</span>
              </div>
              <div className="stat">
                <span className="stat-value">{totalCorrect}</span>
                <span className="stat-label">答对</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatDuration(totalDuration)}</span>
                <span className="stat-label">总用时</span>
              </div>
              <div className="stat">
                <span className="stat-value">{moodLabel(latestMood)}</span>
                <span className="stat-label">情绪（最近一次）</span>
              </div>
              <div className="stat">
                <span className="stat-value">{anyShort ? '有' : '无'}</span>
                <span className="stat-label">短时记录（不足 2 分钟）</span>
              </div>
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">基线</h2>
          {state.baseline ? (
            <>
              <p className="muted small">{formatDateZh(state.baseline.date)}</p>
              <div className="result-grid">
                {DIMS.map((dim) => {
                  const result = state.baseline?.dimensions[dim];
                  if (!result) return null;
                  return (
                    <div key={dim} className="result-row">
                      <div>
                        <strong>{DIM_LABEL[dim]}</strong>
                      </div>
                      <span className="result-value">
                        {result.correct}/{result.answered}
                      </span>
                      {result.stopped && <span className="tag">提前停止</span>}
                    </div>
                  );
                })}
              </div>
              {state.baseline.productionNotes.length > 0 && (
                <div>
                  <p className="small">产出记录</p>
                  <ul className="notes-list">
                    {state.baseline.productionNotes.map((note, index) => (
                      <li key={`${note}-${index}`}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="muted">还没做基线测</p>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">语块进度</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>语块</th>
                  <th>对应教材</th>
                  <th>盒</th>
                  <th>成功天数</th>
                  <th>下次到期</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {content.chunks.map((chunk) => {
                  const card = state.cards[chunk.id] ?? newCard(chunk.id);
                  return (
                    <tr key={chunk.id}>
                      <td>
                        <strong>{chunk.chunk}</strong>
                        <span className="cell-sub">{chunk.glossZh}</span>
                      </td>
                      <td>{chunk.textbook}</td>
                      <td>{card.box === 0 ? '未开始' : card.box}</td>
                      <td>{card.successDates.length}</td>
                      <td>{card.nextDue ?? '—'}</td>
                      <td>{isMastered(card) ? '已掌握' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">最近记录</h2>
          {recentSessions.length === 0 ? (
            <p className="muted">还没有记录</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>用时</th>
                    <th>答对 / 答题</th>
                    <th>新卡</th>
                    <th>情绪</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => {
                    const correct = session.items.filter((item) => item.correct).length;
                    return (
                      <tr key={session.id}>
                        <td>{formatDateZh(session.date)}</td>
                        <td>{formatDuration(session.endedAt - session.startedAt)}</td>
                        <td>
                          {correct} / {session.items.length}
                        </td>
                        <td>{session.newCardIds.length}</td>
                        <td>{moodLabel(session.mood)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">设置</h2>
          <div className="settings-grid">
            <label className="field">
              <span>孩子昵称</span>
              <input
                className="text-input"
                type="text"
                value={state.childName}
                onChange={(event) => updateChildName(event.target.value)}
                placeholder="例如：小宝"
                maxLength={20}
              />
            </label>
            <label className="field">
              <span>每周新语块</span>
              <select
                className="select-input"
                value={state.settings.newPerWeek}
                onChange={(event) => updateNewPerWeek(Number(event.target.value))}
              >
                <option value={2}>2 个</option>
                <option value={3}>3 个</option>
              </select>
            </label>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">数据</h2>
          <div className="panel-actions">
            <button className="primary" onClick={exportData}>导出 JSON</button>
            <button className="danger" onClick={resetData}>清空学习记录</button>
          </div>
          <p className="footnote">数据只保存在这台设备的浏览器里。换设备或清理浏览器前，先导出备份。</p>
        </section>
      </main>
    </div>
  );
}
