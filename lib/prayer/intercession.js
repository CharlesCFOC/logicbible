import { extraIntercessionThemes } from './intercession-extra-topics.js';

export const intercessionTopics = [
  { id: 'families', label: 'Families', title: 'Families & relationships', detail: 'Pray for peace, reconciliation, wisdom, and strong homes.', verse: 'Joshua 24:15' },
  { id: 'healing', label: 'Healing', title: 'Healing & strength', detail: 'Pray for those facing sickness, grief, exhaustion, and recovery.', verse: 'James 5:16' },
  { id: 'nations', label: 'Nations', title: 'Nations & peace', detail: 'Pray for leaders, justice, peace, and people affected by conflict.', verse: '1 Timothy 2:1–2' },
  { id: 'salvation', label: 'Faith', title: 'Salvation & faith', detail: 'Pray for people to encounter Christ and grow in faith.', verse: '1 Timothy 2:4' },
  { id: 'church', label: 'Church', title: 'The Church', detail: 'Pray for unity, courage, wisdom, and faithful witness.', verse: 'Ephesians 4:3' },
  ...extraIntercessionThemes.map(({ focuses, ...theme }) => theme),
];
export const familyPrayerTopics = [
  { id: 'family-restoration', title: 'Restoration in families', detail: 'Pray for reconciliation, forgiveness, and healed relationships at home.', verse: 'Colossians 3:13' },
  { id: 'family-unity', title: 'Unity in families', detail: 'Pray for patience, listening hearts, and a love that keeps families together.', verse: 'Psalm 133:1' },
  { id: 'family-balance', title: 'Balanced, healthy homes', detail: 'Pray for wisdom, peace, and rhythms that help every generation flourish.', verse: 'Proverbs 24:3–4' },
  { id: 'family-salvation', title: 'Families coming to Jesus', detail: 'Pray for every household to encounter Christ and grow in faith together.', verse: 'Acts 16:31' },
  { id: 'family-covering', title: 'God’s covering over families', detail: 'Pray for protection, courage, and the presence of Jesus in every home.', verse: 'Psalm 91:1–2' },
];
export const familyPrayerGuides = [
  ['Bring a strained relationship before God.', 'Ask for the courage to forgive.', 'Pray for a fresh start in your home.'],
  ['Ask God to help you listen with patience.', 'Pray for honest, gentle conversations.', 'Bless each member of your family by name.'],
  ['Confide the pressures of daily life to God.', 'Ask for wisdom in your family’s decisions.', 'Pray for rest and peace in your home.'],
  ['Pray by name for loved ones seeking faith.', 'Ask God for opportunities to share his love.', 'Pray for your family to grow closer to Jesus.'],
  ['Entrust your children and loved ones to God.', 'Pray for safety, health, and wise choices.', 'Ask for courage and God’s presence today.'],
];
const additionalPrayerFocuses = {
  ...Object.fromEntries(extraIntercessionThemes.map(theme => [theme.id, theme.focuses])),
  healing: [
    ['Healing for the sick', 'Bring those facing illness to God and pray for healing and good care.', 'James 5:16'],
    ['Strength for caregivers', 'Pray for rest, patience, and support for those caring for others.', 'Isaiah 40:31'],
    ['Comfort in grief', 'Ask God to draw near to those mourning and surround them with love.', 'Psalm 34:18'],
    ['Peace for anxious hearts', 'Confide our fears to God and pray for renewed peace and hope.', 'Philippians 4:6–7'],
    ['Hope in recovery', 'Pray for courage, daily strength, and steady progress in recovery.', 'Romans 15:13'],
  ],
  nations: [
    ['Wisdom for leaders', 'Pray for leaders to serve with humility, wisdom, and integrity.', '1 Timothy 2:1–2'],
    ['Peace in conflict', 'Pray for an end to violence and for paths toward reconciliation.', 'Matthew 5:9'],
    ['Protection for the displaced', 'Pray for safety, shelter, and welcome for refugees and displaced families.', 'Psalm 46:1'],
    ['Justice for the vulnerable', 'Ask God to defend the oppressed and guide us to act with compassion.', 'Micah 6:8'],
    ['Hope for our communities', 'Pray for our cities to flourish in peace, generosity, and mutual care.', 'Jeremiah 29:7'],
  ],
  salvation: [
    ['Loved ones seeking God', 'Pray by name for loved ones to encounter the love of Jesus.', '1 Timothy 2:4'],
    ['Open hearts', 'Ask God to open hearts to his word and bring understanding.', 'Acts 16:14'],
    ['Courage to share faith', 'Pray for gentle words and courage to share the hope we have.', '1 Peter 3:15'],
    ['Growing in faith', 'Pray for new believers to find support and grow closer to Christ.', 'Colossians 2:6–7'],
    ['Returning to God', 'Pray for those who feel far from God to find welcome and a fresh start.', 'Luke 15:20'],
  ],
  church: [
    ['Unity in the Church', 'Pray for humility, reconciliation, and love between believers.', 'Ephesians 4:3'],
    ['Wisdom for church leaders', 'Ask God to guide pastors and leaders with wisdom and servant hearts.', 'James 1:5'],
    ['Care for those in need', 'Pray for churches to notice needs and serve with practical compassion.', 'Galatians 6:2'],
    ['Courage for persecuted believers', 'Pray for protection, comfort, and courage for believers facing persecution.', 'Hebrews 13:3'],
    ['Faithful witness', 'Pray for our lives and churches to reflect the love of Jesus.', 'Matthew 5:16'],
  ],
};
export function getPrayerTopics(themeId) {
  return additionalPrayerFocuses[themeId]?.map(([title, detail, verse], index) => ({ id: `${themeId}-${index}`, title, detail, verse })) || familyPrayerTopics;
}
export function getPrayerGuides(themeId, index) {
  if (themeId === 'families') return familyPrayerGuides[index];
  const focus = getPrayerTopics(themeId)[index];
  return [focus.detail, 'Bring a person or situation you know before God.', 'Ask God how you can respond with love today.'];
}
export const PREPARATION_MS = 60_000;
export const PRAYER_MS = 600_000;
export const GLOBAL_SESSION_MS = 600_000;
export const GLOBAL_TOPIC_MS = 120_000;
const key = 'intercession.local.v1';
const validTopic = id => intercessionTopics.some(topic => topic.id === id);
export function formatIntercessionTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
export function formatPrayerDuration(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  if (!minutes) return `${remainingSeconds}s`;
  return `${minutes} min${remainingSeconds ? ` ${remainingSeconds}s` : ''}`;
}
export function getIntercessionPhase(session, now) {
  if (!session) return { phase: 'ready', secondsLeft: 60 };
  if (Number.isFinite(session.endsAt)) {
    return session.completed || now >= session.endsAt
      ? { phase: 'complete', secondsLeft: 0 }
      : { phase: 'praying', secondsLeft: Math.ceil((session.endsAt - now) / 1000) };
  }
  const elapsed = Math.max(0, now - session.startedAt);
  if (session.completed || elapsed >= PREPARATION_MS + PRAYER_MS) return { phase: 'complete', secondsLeft: 0 };
  if (elapsed < PREPARATION_MS) return { phase: 'prepare', secondsLeft: Math.ceil((PREPARATION_MS - elapsed) / 1000) };
  return { phase: 'praying', secondsLeft: Math.ceil((PREPARATION_MS + PRAYER_MS - elapsed) / 1000) };
}
export function formatIntercessionClock(timestamp, timeZone) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', hour12: true, ...(timeZone ? { timeZone } : {}) }).format(timestamp);
}
export function getGlobalIntercessionSchedule(now) {
  // Anchor sessions to clock boundaries, never to when a participant opens the room.
  const sessionStartsAt = Math.floor(now / GLOBAL_SESSION_MS) * GLOBAL_SESSION_MS;
  const untilNext = interval => Math.max(1, Math.ceil((interval - (now % interval)) / 1000));
  return {
    nextSessionSeconds: untilNext(GLOBAL_SESSION_MS),
    nextTopicSeconds: untilNext(GLOBAL_TOPIC_MS),
    familyTopicIndex: Math.floor((now % GLOBAL_SESSION_MS) / GLOBAL_TOPIC_MS),
    sessionStartsAt,
    sessionEndsAt: sessionStartsAt + GLOBAL_SESSION_MS,
    topicProgress: (now % GLOBAL_TOPIC_MS) / GLOBAL_TOPIC_MS,
  };
}
export function getPrayerFocus(topicId, familyTopicIndex = 0) {
  if (topicId === 'families') return familyPrayerTopics[familyTopicIndex % familyPrayerTopics.length];
  return intercessionTopics.find(topic => topic.id === topicId) || intercessionTopics[0];
}
export function createIntercessionStore(storage, now = Date.now) {
  let stored;
  try { stored = JSON.parse(storage.getItem(key)); } catch { /* Local storage is optional. */ }
  const oldCount = (() => { try { return Number(storage.getItem('brother.intercessionSessions') || 0); } catch { return 0; } })();
  const count = stored?.version === 1 ? stored.count : oldCount;
  const prayerSeconds = stored?.version === 1 && Number.isFinite(stored.prayerSeconds) && stored.prayerSeconds >= 0 ? Math.floor(stored.prayerSeconds) : 0;
  const session = stored?.session;
  let state = {
    version: 1,
    count: Number.isSafeInteger(count) && count >= 0 ? count : 0,
    prayerSeconds,
    vote: validTopic(stored?.vote) ? stored.vote : null,
    session: session && validTopic(session.topicId) && Number.isFinite(session.startedAt) && session.startedAt >= 0 && session.startedAt <= now()
      ? { topicId: session.topicId, startedAt: session.startedAt, completed: session.completed === true, ...(Number.isFinite(session.endsAt) && session.endsAt > session.startedAt && session.endsAt <= session.startedAt + GLOBAL_SESSION_MS ? { endsAt: session.endsAt } : {}) } : null,
  };
  const listeners = new Set();
  const save = next => {
    state = next;
    try { storage.setItem(key, JSON.stringify(state)); } catch { /* Keep the session working in memory. */ }
    listeners.forEach(listener => listener());
  };
  const tick = () => {
    if (state.session && !state.session.completed && getIntercessionPhase(state.session, now()).phase === 'complete') {
      const finishedAt = now();
      const endAt = Number.isFinite(state.session.endsAt) ? Math.min(finishedAt, state.session.endsAt) : finishedAt;
      const durationSeconds = Math.max(0, Math.round((endAt - state.session.startedAt) / 1000));
      save({ ...state, count: state.count + 1, prayerSeconds: state.prayerSeconds + durationSeconds, session: { ...state.session, completed: true, finishedAt, durationSeconds } });
      return { durationSeconds, finishedAt, totalPrayerSeconds: state.prayerSeconds };
    }
    return null;
  };
  tick();
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    tick,
    vote(topicId) { if (validTopic(topicId)) save({ ...state, vote: topicId }); },
    join() {
      tick();
      if (state.session && !state.session.completed) return;
      save({ ...state, session: { topicId: state.vote || intercessionTopics[0].id, startedAt: now(), completed: false } });
    },
    joinGlobal(topicId = 'families') {
      tick();
      if (state.session && !state.session.completed && state.session.endsAt) return;
      const joinedAt = now();
      save({ ...state, session: { topicId: validTopic(topicId) ? topicId : 'families', startedAt: joinedAt, endsAt: getGlobalIntercessionSchedule(joinedAt).sessionEndsAt, completed: false } });
    },
    finishGlobal() {
      tick();
      if (!state.session || state.session.completed) return;
      const finishedAt = now();
      const endAt = Number.isFinite(state.session.endsAt) ? Math.min(finishedAt, state.session.endsAt) : finishedAt;
      const durationSeconds = Math.max(0, Math.round((endAt - state.session.startedAt) / 1000));
      const next = { ...state, count: state.count + 1, prayerSeconds: state.prayerSeconds + durationSeconds, session: { ...state.session, completed: true, finishedAt, durationSeconds } };
      save(next);
      return { durationSeconds, finishedAt, totalPrayerSeconds: next.prayerSeconds, count: next.count, themeId: next.session.topicId, startedAt: next.session.startedAt };
    },
    reset() { if (state.session?.completed) save({ ...state, session: null }); },
  };
}
