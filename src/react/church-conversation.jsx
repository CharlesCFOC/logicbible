import React, { useState } from 'react';
import { SharedPilotStage } from './evangelism-pilot.jsx';

export function GuestTeamTable({ teams }) {
  const rows = Math.max(1, ...teams.map(team => team.members.length));
  return <div className="shared-guest-table-wrap"><table className="shared-guest-table">
    <caption>Guests <span>{teams.reduce((total, team) => total + team.members.length, 0)}</span></caption>
    <thead><tr>{teams.map(team => <th scope="col" key={team.id} style={{ '--team-color': team.color }}><i aria-hidden="true" />{team.name}<span>{team.members.length}</span></th>)}</tr></thead>
    <tbody>{Array.from({ length: rows }, (_, index) => <tr key={index}>{teams.map(team => <td key={team.id}>{team.members[index]?.name || (team.members.length ? '—' : 'No guests yet')}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function ChurchConversation({ room, busy, onAction, connected = true }) {
  const { discussion } = room;
  const host = room.viewer.role === 'host';
  const ownTeam = room.teams.find(team => team.id === room.viewer.teamId);
  const [pendingVote, setPendingVote] = useState(null);
  async function choose(choice) {
    if (busy || pendingVote) return;
    if (host) { await onAction('select', { choice }); return; }
    setPendingVote(choice);
    try { await onAction('vote', { choice }); } finally { setPendingVote(null); }
  }
  const extras = choice => <span className="shared-vote-badges">{room.teams.map(team => <span key={team.id} className="shared-vote-badge" style={{ '--team-color': team.color }} aria-label={`${team.name}: ${team.counts[choice.id]} votes`}><i aria-hidden="true" />{team.counts[choice.id]}</span>)}{!host && ownTeam?.ownVote === choice.id && <small className="shared-own-vote">Your vote ✓</small>}</span>;
  const feedback = <p className="shared-vote-feedback" role="status">{!connected ? 'Reconnecting to the session…' : pendingVote ? 'Saving your vote…' : !host && ownTeam?.ownVote ? `Vote recorded: ${ownTeam.ownVote}. The organizer sees it automatically.` : !host ? 'Click a reply to vote. Your view follows the organizer automatically.' : null}</p>;
  const controls = <div className="pilot-presenter-controls"><div className="pilot-presenter-buttons">{host ? <>
    {room.canUndo && <button type="button" disabled={busy} onClick={() => onAction('undo')} aria-label="Go back to your choice">← Back</button>}
    {discussion.phase === 'decision' && room.status === 'playing' && <button type="button" className="pilot-primary" disabled={busy || !discussion.selected} onClick={() => onAction('confirm',{choice:discussion.selected})} aria-label={discussion.selected ? `Confirm response ${discussion.selected}` : 'Choose A, B, C or D'}>{discussion.selected ? `✓ Confirm ${discussion.selected}` : 'Choose a response'}</button>}
    {room.ready && <button type="button" className="pilot-primary" disabled={busy} onClick={() => onAction('next')} aria-label="Continue the conversation">→ Continue</button>}
    {discussion.phase === 'debrief' && room.status === 'playing' ? <button type="button" className="pilot-primary" disabled={busy} onClick={() => onAction('conversation')}>Conversation</button> : discussion.history.length > 0 && <button type="button" disabled={busy} onClick={() => onAction('debrief')} aria-label="Open the debrief">Debrief</button>}
  </> : <span className="shared-guest-status" role="status">{room.ready ? 'Reply confirmed · waiting for the organizer' : room.status === 'finished' ? 'Conversation complete' : ownTeam?.ownVote ? `Your vote: ${ownTeam.ownVote} · waiting for confirmation` : 'Choose A, B, C or D to vote'}</span>}</div></div>;
  return <SharedPilotStage room={room} host={host} onSelect={choose} onSideSlide={sideSlide=>onAction('present',{sideSlide})} onMapExpand={mountainExpanded=>onAction('present',{mountainExpanded})} onDismissJourney={()=>onAction('dismiss')} presenterControls={controls} choiceExtras={extras} choiceFeedback={feedback} choicesDisabled={busy || !!pendingVote || (!host && !ownTeam?.eligible)} discussionFooter={<GuestTeamTable teams={room.teams} />} />;
}
