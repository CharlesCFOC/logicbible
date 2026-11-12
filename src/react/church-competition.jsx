import React, { useEffect, useId, useRef, useState } from 'react';
import { competitionLink, competitionOrganizerPath, competitionRequest, createSharedCompetition, forgetCompetitionAccess, readCompetitionAccess, readCreatedCompetition, saveCompetitionAccess, saveCreatedCompetition } from './church-competition-client.js';

function RoomIcon({ name }) {
  const paths = { link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', check: 'm5 12 4 4L19 6', arrow: 'M5 12h14m-6-6 6 6-6 6', trophy: 'M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 13v6M8 21h8M10 19h4', lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5ZM12 14v3' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export function CompetitionShareLinks({ id, showOrganizer = true }) {
  const [notice, setNotice] = useState('');
  const guestLink = competitionLink(id);
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Join our Church Room teams', url: guestLink });
      else { await navigator.clipboard.writeText(guestLink); setNotice('Guest link copied.'); }
    } catch (error) { if (error.name !== 'AbortError') setNotice('Select and copy the guest link below.'); }
  }
  return <div className="competition-share-links">
    <label>Guest invitation link<input readOnly value={guestLink} onFocus={e => e.target.select()} /></label>
    <div className="competition-action-row">{showOrganizer && <a className="church-primary" href={competitionOrganizerPath(id)}>Open organizer & start game<RoomIcon name="arrow" /></a>}<button type="button" className={showOrganizer ? 'church-secondary' : 'church-primary'} onClick={share}><RoomIcon name="link" />Share guest link</button></div>
    <p>{showOrganizer ? 'The guest link opens the waiting room. Start the competition from the organizer screen to open the questions on everyone’s phone.' : 'The guest link opens the waiting room. Start team competition opens the questions on everyone’s phone.'}</p>
    <details><summary>Manage from another device</summary><p>Open this organizer link and enter the password you chose. Keep this password for the organizer.</p><input aria-label="Organizer link" readOnly value={competitionLink(id, true)} onFocus={e => e.target.select()} /></details>
    {notice && <p role="status">{notice}</p>}
  </div>;
}
export function CompetitionSetup({ scenario, onRoomChange }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(() => readCreatedCompetition(scenario.id));
  const passwordId = useId();
  async function create(e) {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const room = await createSharedCompetition(scenario, password);
      setCreated({ id: room.id, expiresAt: room.expiresAt }); setPassword('');
      saveCreatedCompetition(scenario.id, room);
      onRoomChange?.({ id: room.id, expiresAt: room.expiresAt });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="competition-setup" aria-labelledby="competition-setup-title">
    <span className="church-section-label">03 · PLAY IN TWO TEAMS</span><h2 id="competition-setup-title">One mountain. Two teams.</h2>
    <p>Invite guests on their phones. Each enters a name, joins a randomly assigned, balanced team and votes for its reply. Follow both routes and discover the winner.</p>
    <div className="competition-setup-facts"><span><i className="competition-dot competition-dot--blue" />Blue team</span><span><i className="competition-dot competition-dot--orange" />Orange team</span><span>Up to 8 rounds · link valid for 24 hours</span></div>
    {created ? <><CompetitionShareLinks id={created.id} /><button type="button" className="church-secondary competition-new-session" onClick={() => { setCreated(null); saveCreatedCompetition(scenario.id, null); onRoomChange?.(null); }}>Create another team session</button></> : <form onSubmit={create}>
      <label htmlFor={passwordId}>Organizer password</label><input id={passwordId} type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" disabled={busy} />
      <small>Your device gets organizer access automatically. Use this password to manage from another device.</small>
      <button type="submit" className="church-primary" disabled={busy}>{busy ? 'Creating shared session…' : 'Create & share team session'}<RoomIcon name="arrow" /></button>
    </form>}
    {error && <p className="church-setup-error" role="alert">{error}</p>}
  </section>;
}

const curve = (a, b) => { const dx = (b[0] - a[0]) * .4; return `M${a} C${a[0] + dx},${a[1]} ${b[0] - dx},${b[1]} ${b}`; };
function CompetitionMountain({ teams, round }) {
  const id = useId().replace(/:/g, '');
  return <section className="competition-mountain" aria-label="Both teams’ mountain routes">
    <header><div><span className="church-section-label">THE JOURNEY</span><h2>Two paths to the summit</h2></div><span>Round {round || '—'}</span></header>
    <svg viewBox="0 0 1000 520" role="img" aria-label={teams.map(t => `${t.name}: ${t.score.shelters} shelters, ${t.score.points} points`).join('. ')}>
      <defs><linearGradient id={`${id}-rock`} x2=".8" y2="1"><stop stopColor="#507ca6" /><stop offset="1" stopColor="#1b3557" /></linearGradient></defs>
      <circle cx="910" cy="92" r="48" fill="#ae73f0" opacity=".16" />
      <path d="M0 392 110 310 205 350 360 195 475 270 650 112 740 175 855 65 1000 205V520H0Z" fill="#233f66" />
      <path d="M0 430 90 365 275 300 470 225 665 150 860 75 1000 190V520H0Z" fill={`url(#${id}-rock)`} />
      <path d="m470 225 52 154 143-229-40 216 235-291-60 315 200-200v330H0V430l90-65 96 90 89-155 68 143Z" fill="#172f50" opacity=".5" />
      <path d="m860 75-88 54 27 6 16 28 22-29 20 11 25-7 17 13 31-4Z" fill="#e6effb" />
      <path d="M90 365 275 300 470 225 665 150 860 75" fill="none" stroke="#aec7e1" strokeWidth="3" strokeDasharray="6 10" opacity=".5" />
      {[1, 2, 3, 4].map((n, i) => <g key={n} transform={`translate(${[275,470,665,860][i]},${[300,225,150,75][i]})`}><path d="M-14 0v-18L0-30l14 12V0ZM-4 0v-12h8V0" fill="#1b3459" stroke="#d6e5f5" strokeWidth="2" /><text y="22" textAnchor="middle" fill="#d6e5f5" fontSize="17">{n}</text></g>)}
      {teams.map((team, index) => <g key={team.id} transform={`translate(0,${index ? 7 : -7})`}>
        <title>{team.name}</title>{team.trail.segments.map(segment => <path key={segment.id} d={curve(segment.from, segment.to)} fill="none" stroke={team.color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />)}
        <circle cx={team.trail.current[0]} cy={team.trail.current[1]} r="13" fill="#10203f" stroke={team.color} strokeWidth="5" /><circle cx={team.trail.current[0]} cy={team.trail.current[1]} r="4" fill={team.color} />
      </g>)}
      <text x="90" y="414" textAnchor="middle" fill="#c6d9f0" fontSize="16" fontWeight="700">START</text><text x="860" y="24" textAnchor="middle" fill="#e9e4ff" fontSize="16" fontWeight="700">THE SUMMIT</text>
    </svg>
    <div className="competition-map-legend">{teams.map(t => <span key={t.id} style={{ '--team-color': t.color }}><i />{t.name}<strong>{t.score.points} pts</strong></span>)}</div>
  </section>;
}
function TeamRoster({ teams }) {
  return <div className="competition-rosters">{teams.map(t => <section key={t.id} style={{ '--team-color': t.color }}><h3><i />{t.name}<span>{t.members.length}</span></h3><ul>{t.members.map(p => <li key={p.id}><span>{p.name}</span>{p.voted && <RoomIcon name="check" />}</li>)}</ul>{!t.members.length && <p>Waiting for guests…</p>}</section>)}</div>;
}
function TeamRound({ team, room, busy, onAction }) {
  const host = room.viewer.role === 'host';
  const yours = room.viewer.teamId === team.id;
  const canVote = yours && room.status === 'playing' && team.eligible && !team.locked && !team.done;
  const [draft, setDraft] = useState(null);
  const [draftRound, setDraftRound] = useState(room.roundId);
  const currentDraft = draftRound === room.roundId ? draft || team.ownVote : team.ownVote;
  const panelId = useId();
  return <section className={`competition-team-round${yours ? ' is-your-team' : ''}`} style={{ '--team-color': team.color }} aria-labelledby={panelId}>
    <header><div><span className="competition-team-label"><i />{team.name}{yours && <b>Your team</b>}</span><h2 id={panelId}>{team.done ? 'Summit reached' : team.scene?.title || 'Ready to climb'}</h2></div><strong>{team.score.points}<small>pts</small></strong></header>
    {team.done ? <p>Your team has reached all four shelters. Follow the other team’s journey.</p> : <>
      <p className="competition-scene-line">{team.scene?.line}</p>
      <div className="competition-vote-status" role="status"><span>{team.locked ? 'Team choice confirmed' : `${team.voted} / ${team.expected} votes`}</span>{team.locked && <RoomIcon name="lock" />}</div>
      {(host || yours) && <div className="competition-vote-choices">{team.scene?.choices.map(choice => <button type="button" key={choice.id} disabled={!canVote || busy} className={`competition-vote-choice${currentDraft === choice.id ? ' is-selected' : ''}`} aria-pressed={currentDraft === choice.id} onClick={() => { setDraft(choice.id); setDraftRound(room.roundId); }}><b>{choice.id}</b><span>{choice.text}</span>{(host || yours) && <small>{choice.votes}</small>}</button>)}</div>}
      {canVote && <button type="button" className="church-primary competition-vote-submit" disabled={busy || !currentDraft || currentDraft === team.ownVote} onClick={() => onAction('vote', { choice: currentDraft })}><RoomIcon name="check" />{team.ownVote ? 'Update my vote' : 'Confirm my vote'}</button>}
      {yours && !team.eligible && !team.locked && <p className="competition-hint">You joined during this round. Your vote opens next round.</p>}
      {team.locked && !room.ready && <p className="competition-hint">Waiting for the other team. Results appear together.</p>}
      {host && !team.locked && <button type="button" className="church-secondary" disabled={busy || !team.voted} onClick={() => onAction('close', { teamId: team.id })}>Close this team’s vote</button>}
    </>}
    {team.result && <div className={`competition-result competition-result--${team.result.quality}`}><span className="church-section-label">CONFIRMED · RESPONSE {team.result.choice}{team.result.tied ? ' · RANDOM TIE-BREAK' : ''}</span><blockquote>{team.result.text}</blockquote><p><strong>{room.character.name}:</strong> {team.result.reaction}</p><p>{team.result.review}</p><small>{team.result.reference}</small></div>}
  </section>;
}
function CompetitionFinal({ room }) {
  const tied = room.winners.length > 1;
  const winners = room.teams.filter(t => room.winners.includes(t.id));
  return <section className="competition-final">
    <RoomIcon name="trophy" /><span className="church-section-label">THE FINAL RESULT</span><h1>{tied ? 'A shared victory!' : `${winners[0]?.name} wins!`}</h1><p>100 points per shelter, plus up to 100 points for reply quality: strong = 3, partial = 1, problematic = 0, averaged across your replies.</p>
    <div className="competition-final-scores">{[...room.teams].sort((a,b) => b.score.points - a.score.points).map(team => <div key={team.id} style={{ '--team-color': team.color }}><span>{team.name}</span><strong>{team.score.points}<small> pts</small></strong><p>{team.score.shelters} / 4 shelters · {team.score.quality}% reply quality</p></div>)}</div>
    {room.review.map(team => <details key={team.teamId}><summary>{room.teams.find(t => t.id === team.teamId).name} · review the journey</summary><ol>{team.entries.map((entry, i) => <li key={i}><strong>{entry.title} · {entry.choice}</strong><blockquote>{entry.text}</blockquote><p>{entry.review}</p><small>{entry.reference}</small></li>)}</ol></details>)}
  </section>;
}
export function ChurchCompetitionPage({ roomId, adminMode }) {
  const role = adminMode ? 'host' : 'guest';
  const [token, setToken] = useState(() => readCompetitionAccess(roomId, role));
  const [room, setRoom] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [storageNotice, setStorageNotice] = useState('');
  const [syncError, setSyncError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const mounted = useRef(true), actionInFlight = useRef(false);
  const formId = useId();
  const applyRoom = next => setRoom(old => !old || next.revision === undefined || old.revision === undefined || next.revision >= old.revision ? next : old);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false, timer;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const next = await competitionRequest({ room: roomId, token, signal: controller.signal });
        if (!cancelled) { applyRoom(next); setSyncError(''); }
      } catch (err) {
        if (!cancelled) {
          setSyncError(err.message);
          if (err.status === 401) { forgetCompetitionAccess(roomId, role); setToken(''); setRoom(null); }
          if ([404, 410].includes(err.status)) { setExpired(true); cancelled = true; }
        }
      } finally { if (!cancelled) timer = setTimeout(refresh, document.hidden ? 6000 : 1600); }
    };
    refresh();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [roomId, token, role]);
  async function action(command, extra = {}) {
    if (actionInFlight.current) return;
    actionInFlight.current = true; setBusy(true); setError('');
    try {
      const next = await competitionRequest({ room: roomId, action: command, token, roundId: room?.roundId, ...extra });
      if (!mounted.current) return;
      if (next.token) {
        if (!saveCompetitionAccess(roomId, role, next.token)) setStorageNotice('Keep this tab open: this browser cannot remember your access.');
        setToken(next.token); setPassword('');
      }
      applyRoom(next);
    } catch (err) { if (mounted.current) setError(err.message); }
    finally { actionInFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const host = room?.viewer?.role === 'host';
  const ownTeam = room?.teams?.find(t => t.id === room.viewer?.teamId);
  const waitingTeams = room?.teams?.filter(t => !t.members.length) || [];
  return <main className="competition-page">
    <nav className="competition-topbar"><a href="evangelism-pilot.html">← Church room</a><span>{host ? 'ORGANIZER' : 'TEAM SESSION'}</span>{room?.viewer?.name && <b style={{ color: ownTeam?.color }}>{room.viewer.name}</b>}</nav>
    {error && <div className="competition-error" role="alert">{error}</div>}
    {syncError && <div className="competition-error" role="alert">{syncError}</div>}
    {storageNotice && <p className="competition-hint" role="status">{storageNotice}</p>}
    {!room && !expired && <p role="status">Connecting to your session…</p>}
    {room && !room.viewer && !expired && <section className="competition-entry"><div className="competition-entry-icon"><RoomIcon name={adminMode ? 'lock' : 'users'} /></div><span className="church-section-label">{adminMode ? 'ORGANIZER ACCESS' : 'YOU’RE INVITED'}</span><h1>{room.title}</h1><p>{adminMode ? 'Enter the organizer password to manage this session from this device.' : 'Choose a guest name. We’ll assign you to the blue or orange team at random, keeping both teams balanced.'}</p>
      {room.status === 'finished' && !adminMode ? <p>This game is finished. Ask the organizer for the next session.</p> : <form onSubmit={e => { e.preventDefault(); action(adminMode ? 'admin-login' : 'join', adminMode ? { password } : { name }); }}><label htmlFor={formId}>{adminMode ? 'Organizer password' : 'Your guest name'}</label><input id={formId} required type={adminMode ? 'password' : 'text'} autoComplete={adminMode ? 'current-password' : 'nickname'} minLength={adminMode ? 6 : 2} maxLength={adminMode ? 128 : 32} value={adminMode ? password : name} onChange={e => adminMode ? setPassword(e.target.value) : setName(e.target.value)} /><button type="submit" className="church-primary" disabled={busy}>{busy ? 'Connecting…' : adminMode ? 'Manage session' : 'Join my team'}<RoomIcon name="arrow" /></button></form>}
      {!adminMode && <a className="competition-admin-link" href={competitionLink(roomId, true)}>Organizer access</a>}
    </section>}
    {room?.viewer && !expired && <>
      <header className="competition-game-header"><div><span className="church-section-label">{room.status === 'lobby' ? 'GATHER YOUR TEAMS' : room.status === 'finished' ? 'JOURNEY COMPLETE' : `ROUND ${room.round} / ${room.roundLimit}`}</span><h1>{room.title}</h1><p>{room.question}</p></div>{ownTeam && <span className="competition-your-team" style={{ '--team-color': ownTeam.color }}><i />{ownTeam.name}</span>}</header>
      {room.status === 'lobby' ? <div className="competition-lobby"><section><h2>{host ? 'Invite your group' : `Welcome to the ${ownTeam?.name.toLowerCase()}`}</h2><p>{host ? 'Share the guest link. Start when at least one guest has joined each team.' : 'Waiting for the organizer to start the competition. The questions and reply buttons will appear here automatically.'}</p><p className="competition-hint" role="status">{waitingTeams.length ? `Waiting for at least one guest in: ${waitingTeams.map(t => t.name).join(', ')}.` : 'Both teams are ready. The organizer can start the first round.'}</p>{host ? <CompetitionShareLinks id={room.id} showOrganizer={false} /> : <a className="competition-admin-link" href={competitionOrganizerPath(room.id)}>Are you the organizer? Open the organizer screen</a>}<TeamRoster teams={room.teams} />{host && <button type="button" className="church-primary competition-start" disabled={busy || waitingTeams.length > 0} onClick={() => action('start')}>Start team competition<RoomIcon name="arrow" /></button>}</section><aside><CompetitionMountain teams={room.teams} round={room.round} /><details><summary>The mission & rules</summary><p>{room.context}</p><p>{room.goal}</p><p>One vote per guest. The most popular reply is confirmed when all team members have voted; the organizer can close voting early. Ties are drawn at random. New guests vote from the next round.</p><p>Up to 8 rounds. 100 points per shelter, plus up to 100 points for reply quality. Equal final scores share the victory.</p></details></aside></div> : <>
        {room.status === 'finished' && <CompetitionFinal room={room} />}
        <div className="competition-playing"><div>{room.status !== 'finished' && (host ? room.teams : room.teams.filter(t => t.id === room.viewer.teamId)).map(team => <TeamRound key={team.id} team={team} room={room} busy={busy} onAction={action} />)}</div><aside><CompetitionMountain teams={room.teams} round={room.round} />{room.status !== 'finished' && <TeamRoster teams={room.teams} />}{host && <details className="competition-invite-during-game"><summary>Invite guests / organizer link</summary><CompetitionShareLinks id={room.id} showOrganizer={false} /></details>}</aside></div>
        {room.status === 'playing' && <div className="competition-round-controls">{host ? <><span>{room.ready ? 'Both teams’ choices are confirmed.' : 'Teams are voting on their replies.'}</span><button type="button" className="church-primary" disabled={busy || !room.ready} onClick={() => action('next')}>{room.round >= room.roundLimit || room.teams.every(t => t.done) ? 'Show final result' : 'Continue to the next round'}<RoomIcon name="arrow" /></button></> : <p role="status">{room.ready ? 'Both choices are confirmed. The organizer will continue the journey.' : 'Vote with your team. The other team follows its own route.'}</p>}</div>}
      </>}
    </>}
  </main>;
}
