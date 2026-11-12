import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { readJsonBody, sendJson } from '../http/json.js';
import { sessionClientIp, withinRateLimit } from '../http/rate-limit.js';
import { getSupabaseAdminClient, getSupabaseServerClient } from '../supabase/server.js';
import { authenticateAiRequest } from '../ai/access.js';
import { addCompetitionGuest, advanceCompetition, castCompetitionVote, chooseCompetitionReply, closeCompetitionBallot, competitionError, competitionKind, competitionScenario, competitionView, createCompetition, guestName, startCompetition } from '../../src/shared/church-competition.js';

const attempts = new Map();
const columns = 'id, status, admin_password_salt, admin_password_hash, course_content';
const hashToken = token => createHash('sha256').update(token).digest('hex');
const secret = () => randomBytes(32).toString('hex');
const validId = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
const tokenFrom = req => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
function actorFor(room, token) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = hashToken(token);
  if (room.hostTokens.includes(hash)) return { role: 'host' };
  const guest = room.participants.find(p => p.tokenHash === hash);
  return guest ? { ...guest, role: 'guest' } : null;
}
function limit(req, action, count, windowMs, room = '') {
  if (!withinRateLimit(attempts, `${action}:${sessionClientIp(req)}:${room}`, count, windowMs)) throw competitionError('Too many attempts. Please try again shortly.', 429);
}
// Persist alongside the other private church sessions, using the existing RLS
// protected bible_sessions table. A revision filter makes concurrent joins,
// votes and round transitions atomic across server instances.
export function createChurchCompetitionHandler({
  getAdmin = getSupabaseAdminClient,
  authenticate = req => authenticateAiRequest(req, () => getSupabaseServerClient().auth),
  random = () => randomInt(0x1000000) / 0x1000000,
  now = Date.now,
} = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); sendJson(res, 405, { error: 'Use GET or POST.' }); return; }
    const params = new URL(req.url, 'http://localhost').searchParams;
    const body = req.method === 'POST' ? await readJsonBody(req, 260000) : null;
    if (body !== null && (!body || typeof body !== 'object' || Array.isArray(body))) throw competitionError('Invalid command.', 400);
    if (body?.action === 'create') {
      await authenticate(req);
      limit(req, 'competition-create', 10, 3600000);
      const password = body.password;
      if (typeof password !== 'string' || password.length < 6 || password.length > 128) throw competitionError('Choose an organizer password of 6–128 characters.', 400);
      const scenario = competitionScenario(body.scenario);
      const admin = getAdmin();
      const content = createCompetition(scenario, now());
      const token = secret(); content.hostTokens.push(hashToken(token));
      const id = randomUUID(), salt = randomBytes(16).toString('hex');
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error } = await admin.from('bible_sessions').insert({ id, name: `Church teams · ${scenario.title}`.slice(0, 120),
          access_code: String(randomInt(100000000)).padStart(8, '0'), status: 'scheduled',
          admin_password_salt: salt, admin_password_hash: scryptSync(password, salt, 64).toString('hex'), course_content: content });
        if (error?.code === '23505') continue;
        if (error) throw error;
        sendJson(res, 201, { ...competitionView(id, content, { role: 'host' }), token }); return;
      }
      throw competitionError('The session could not be created. Try again.', 503);
    }
    const id = req.method === 'GET' ? params.get('room') : body?.room;
    if (!validId(id)) throw competitionError('This session link is invalid.', 400);
    const admin = getAdmin();
    const action = body?.action;
    if (req.method === 'POST') {
      const limits = { join: [120, 60000], 'admin-login': [8, 900000], vote: [30, 60000], choose: [60, 60000], start: [60, 60000], close: [60, 60000], next: [60, 60000] };
      if (!limits[action]) throw competitionError('Unknown command.', 400);
      limit(req, `competition-${action}`, ...limits[action], action === 'vote' ? `${id}:${hashToken(tokenFrom(req))}` : id);
    }
    // Generate once so retries of the optimistic update preserve guest identity.
    const issuedToken = ['join', 'admin-login'].includes(action) ? secret() : null;
    const guestId = action === 'join' ? randomUUID() : null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const { data: row, error } = await admin.from('bible_sessions').select(columns).eq('id', id).maybeSingle();
      if (error) throw error;
      const content = row?.course_content;
      if (content?.kind !== competitionKind) throw competitionError('This session could not be found.', 404);
      if (content.expiresAt <= now()) throw competitionError('This session has expired. Ask the organizer for a new link.', 410);
      const actor = actorFor(content, tokenFrom(req));
      if (req.method === 'GET') {
        if (tokenFrom(req) && !actor) throw competitionError('Your access has expired. Join the session again.', 401);
        sendJson(res, 200, competitionView(id, content, actor)); return;
      }
      let nextActor = actor;
      if (action === 'join') {
        const name = guestName(body.name);
        addCompetitionGuest(content, { id: guestId, name, tokenHash: hashToken(issuedToken) }, random);
        nextActor = { ...content.participants.at(-1), role: 'guest' };
      } else if (action === 'admin-login') {
        if (typeof body.password !== 'string' || body.password.length > 128) throw competitionError('Incorrect organizer password.', 401);
        const supplied = scryptSync(body.password, row.admin_password_salt, 64);
        const expected = Buffer.from(row.admin_password_hash, 'hex');
        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw competitionError('Incorrect organizer password.', 401);
        // Preserve existing organizers; do not revoke the original device.
        if (content.hostTokens.length >= 20) throw competitionError('Too many organizer devices are connected.');
        content.hostTokens.push(hashToken(issuedToken)); nextActor = { role: 'host' };
      } else {
        if (!actor) throw competitionError('Join the session before continuing.', 401);
        if (action === 'vote') {
          if (actor.role !== 'guest') throw competitionError('Only guests can vote for their team.', 403);
          castCompetitionVote(content, actor.id, body.choice, body.roundId, random);
        } else {
          if (actor.role !== 'host') throw competitionError('Only the organizer can manage the game.', 403);
          if (action === 'start') startCompetition(content, randomUUID());
          if (action === 'choose') chooseCompetitionReply(content, body.teamId, body.choice, body.roundId);
          if (action === 'close') {
            if (body.roundId !== content.roundId) throw competitionError('The round has changed. Refresh the page.');
            closeCompetitionBallot(content, body.teamId, random);
          }
          if (action === 'next') advanceCompetition(content, body.roundId, randomUUID());
        }
      }
      const revision = content.revision;
      content.revision += 1;
      const { data: updated, error: updateError } = await admin.from('bible_sessions').update({ course_content: content })
        .eq('id', id).eq('course_content->>revision', String(revision)).select('id').maybeSingle();
      if (updateError) throw updateError;
      if (!updated) continue;
      sendJson(res, 200, { ...competitionView(id, content, nextActor), ...(issuedToken ? { token: issuedToken } : {}) }); return;
    }
    throw competitionError('Several people voted together. Please try again.', 409);
  };
}
export const handleChurchCompetition = createChurchCompetitionHandler();
