import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { createIntercessionStore, intercessionTopics, getPrayerTopics, formatIntercessionClock, formatIntercessionTime, formatPrayerDuration, getGlobalIntercessionSchedule, getIntercessionPhase } from '../../lib/prayer/intercession.js';
import { globePoint, loadCoastline, loadCountryBorders, projectGlobePoint } from '../../lib/prayer/interactive-globe.js';
import { mountainRanges } from '../../lib/prayer/mountain-ranges.js';
import { bathymetryBands } from '../../lib/prayer/bathymetry.js';
import { continentalReliefPoints } from '../../lib/prayer/relief-points.js';
import { getPublishedPrayerLines, PRAYER_LINE_MS, PRAYER_LINES_PER_FOCUS, validatePrayerJournal } from '../../lib/prayer/intercession-journal.js';
import { createIntercessionPresence } from '../../lib/prayer/intercession-live.js';
import { countReminderSlots, normalizeReminderSchedule, readReminderSchedule, reminderDays, reminderSlots, writeReminderSchedule } from '../../lib/prayer/intercession-reminders.js';

const sampleCountries = [
  { code: 'CA', atlasId: '124', latitude: 56, longitude: -106, count: 30 }, { code: 'US', atlasId: '840', latitude: 38, longitude: -97, count: 18 },
  { code: 'GB', atlasId: '826', latitude: 55, longitude: -3, count: 9 }, { code: 'FR', atlasId: '250', latitude: 46, longitude: 2, count: 7 },
  { code: 'KE', atlasId: '404', latitude: 0, longitude: 37, count: 5 }, { code: 'ZA', atlasId: '710', latitude: -30, longitude: 25, count: 4 },
  { code: 'AU', atlasId: '36', latitude: -25, longitude: 134, count: 3 },
];

const countryBlueTones = ['#126795', '#146a98', '#166d9b', '#18709e', '#1a73a1', '#1c76a4'];
const countryNameAliases = {
  US: ['United States of America'], GB: ['United Kingdom'], RU: ['Russia'], KR: ['South Korea'], KP: ['North Korea'],
  CD: ['Dem. Rep. Congo', 'Democratic Republic of the Congo'], CG: ['Congo'], CI: ['Ivory Coast'],
  BO: ['Bolivia'], VE: ['Venezuela'], TZ: ['Tanzania'], SY: ['Syria'], IR: ['Iran'], MD: ['Moldova'],
  VN: ['Vietnam'], LA: ['Laos'], BN: ['Brunei'], TW: ['Taiwan'], PS: ['Palestine'], MK: ['Macedonia'],
};
const degrees = value => value * Math.PI / 180;

function countryBlue(atlasId) {
  let hash = 0;
  for (const character of atlasId) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return countryBlueTones[Math.abs(hash) % countryBlueTones.length];
}

function normalizeCountryName(name) {
  return String(name || '').toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\b(the|of)\b/g, '').replace(/\s+/g, ' ');
}

function countryLabel(code) {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; }
}

function atlasIdForCountryCode(code, countries) {
  if (!/^[A-Z]{2}$/.test(code || '')) return null;
  let displayName = '';
  try { displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || ''; } catch {}
  const names = [displayName, ...(countryNameAliases[code] || [])].map(normalizeCountryName).filter(Boolean);
  return countries.find(country => names.includes(normalizeCountryName(country.name)))?.id || null;
}

function InteractiveGlobe({ countryCodes = [] }) {
  const canvasRef = useRef(null);
  const centeredOnLiveCountry = useRef(false);
  const rotationRef = useRef({ yaw: -1.92, pitch: -0.23, zoom: 1.16, velocityX: 0, velocityY: 0, dragging: false, pointerId: null, x: 0, y: 0, pointers: new Map(), pinchDistance: 0, pinchZoom: 1 });
  const [countryBorders, setCountryBorders] = useState([]);
  const [coastline, setCoastline] = useState([]);
  const prayingCountryIds = useMemo(() => new Set(countryCodes.map(code => atlasIdForCountryCode(code, countryBorders)).filter(Boolean)), [countryCodes, countryBorders]);

  useEffect(() => {
    if (centeredOnLiveCountry.current || !prayingCountryIds.size || !countryBorders.length) return;
    const country = countryBorders.find(item => prayingCountryIds.has(item.id));
    const ring = country?.rings.find(points => points.length > 2);
    if (!ring) return;
    const stride = Math.max(1, Math.floor(ring.length / 240));
    const points = ring.filter((_, index) => index % stride === 0);
    const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y, z: sum.z + point.z }), { x: 0, y: 0, z: 0 });
    const longitude = Math.atan2(center.x, center.z);
    const latitude = Math.atan2(center.y, Math.hypot(center.x, center.z));
    rotationRef.current.yaw = -longitude;
    rotationRef.current.pitch = Math.max(-1.2, Math.min(1.2, latitude));
    rotationRef.current.velocityX = 0;
    rotationRef.current.velocityY = 0;
    centeredOnLiveCountry.current = true;
  }, [countryBorders, prayingCountryIds]);

  useEffect(() => {
    let active = true;
    Promise.all([loadCountryBorders(), loadCoastline()]).then(([borders, coast]) => {
      if (!active) return;
      setCountryBorders(borders);
      setCoastline(coast);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;
    let frame;
    let lastDraw = 0;
    const draw = () => {
      frame = window.requestAnimationFrame(draw);
      const timestamp = performance.now();
      if (timestamp - lastDraw < 24) return;
      lastDraw = timestamp;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const size = Math.min(rect.width, rect.height);
      const radius = size * 0.4 * rotationRef.current.zoom;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotation = rotationRef.current;
      if (!rotation.dragging && (Math.abs(rotation.velocityX) > .0001 || Math.abs(rotation.velocityY) > .0001)) {
        rotation.yaw += rotation.velocityX;
        rotation.pitch = Math.max(-1.2, Math.min(1.2, rotation.pitch + rotation.velocityY));
        rotation.velocityX *= .94;
        rotation.velocityY *= .94;
      }
      const renderDetail = !rotation.dragging && rotation.pointers.size === 0 && Math.abs(rotation.velocityX) < .001 && Math.abs(rotation.velocityY) < .001;
      const atmosphere = context.createRadialGradient(centerX, centerY, radius * .88, centerX, centerY, radius * 1.07);
      atmosphere.addColorStop(0, 'rgba(126, 231, 255, 0)');
      atmosphere.addColorStop(.3, 'rgba(126, 231, 255, .16)');
      atmosphere.addColorStop(.58, 'rgba(126, 231, 255, .72)');
      atmosphere.addColorStop(.82, 'rgba(126, 231, 255, .26)');
      atmosphere.addColorStop(1, 'rgba(126, 231, 255, 0)');
      context.beginPath(); context.arc(centerX, centerY, radius * 1.07, 0, Math.PI * 2); context.fillStyle = atmosphere; context.fill();
      context.save(); context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2); context.clip();
      const ocean = context.createRadialGradient(centerX - radius * .34, centerY - radius * .42, radius * .04, centerX, centerY, radius * 1.1);
      ocean.addColorStop(0, 'rgba(64, 190, 226, .88)');
      ocean.addColorStop(.28, 'rgba(13, 103, 157, .92)');
      ocean.addColorStop(.68, 'rgba(5, 57, 104, .95)');
      ocean.addColorStop(1, 'rgba(2, 24, 59, .98)');
      context.fillStyle = ocean; context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      const project = point => {
        const projected = projectGlobePoint(point, rotation.yaw, rotation.pitch);
        return { ...projected, x: centerX + projected.x * radius * projected.scale, y: centerY - projected.y * radius * projected.scale };
      };
      const drawBathymetryRing = (ring, fill) => {
        let segment = [];
        const fillSegment = () => {
          if (segment.length < 3) return;
          context.beginPath();
          segment.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
          context.closePath();
          context.fillStyle = fill;
          context.fill();
          segment = [];
        };
        ring.forEach(([latitude, longitude]) => {
          const projected = project(globePoint(latitude, longitude));
          if (projected.z > .04) segment.push(projected);
          else fillSegment();
        });
        fillSegment();
      };
      if (renderDetail) {
        bathymetryBands.forEach(band => {
          const fill = band.depth <= 200 ? 'rgba(18, 101, 159, .22)'
            : band.depth <= 1000 ? 'rgba(8, 75, 134, .22)'
              : band.depth <= 2000 ? 'rgba(6, 60, 116, .24)'
                : band.depth <= 4000 ? 'rgba(4, 45, 94, .26)'
                  : band.depth <= 6000 ? 'rgba(2, 34, 75, .29)'
                    : 'rgba(1, 22, 56, .32)';
          band.rings.forEach(ring => drawBathymetryRing(ring, fill));
        });
      }
      const drawCoastlineHalo = ring => {
        let segment = [];
        const strokeSegment = () => {
          if (segment.length < 2) return;
          context.beginPath();
          segment.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
          context.stroke();
          segment = [];
        };
        // Coastlines are already decoded into 3D unit vectors by decodeCoastline.
        // Treating them as [latitude, longitude] throws on every animation frame.
        ring.forEach(point => {
          const projected = project(point);
          if (projected.z > .035) segment.push(projected);
          else strokeSegment();
        });
        strokeSegment();
      };
      if (coastline.length) {
        context.save();
        context.globalCompositeOperation = 'screen';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.strokeStyle = 'rgba(126, 231, 255, .4)';
        context.lineWidth = 1.35;
        coastline.forEach(drawCoastlineHalo);
        context.restore();
      }
      const drawCountry = (ring, active, countryId) => {
        let segment = [];
        const fillSegment = () => {
          if (segment.length < 3) return;
          context.beginPath();
          segment.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
          context.closePath();
          const prayerHighlight = active;
          context.save();
          context.fillStyle = prayerHighlight ? '#ff8d43' : countryBlue(countryId);
          if (prayerHighlight) {
            context.shadowColor = 'rgba(255, 112, 35, .92)';
            context.shadowBlur = 14;
          }
          context.fill();
          context.restore();
        };
        ring.forEach(point => {
          const projected = project(point);
          if (projected.z > 0) segment.push(projected);
          else { fillSegment(); segment = []; }
        });
        fillSegment();
      };
      if (countryBorders.length) {
        countryBorders.forEach(country => {
          const active = prayingCountryIds.has(country.id);
          country.rings.forEach(ring => drawCountry(ring, active, country.id));
        });
      }
      if (renderDetail) {
        context.save();
        context.globalCompositeOperation = 'multiply';
        continentalReliefPoints.forEach(point => {
          const projected = project(globePoint(point.latitude, point.longitude));
          if (projected.z < .05) return;
          const elevationRatio = Math.max(0, Math.min(1, (point.elevation - 300) / 8500));
          const patchRadius = radius * (.045 + elevationRatio * .055);
          const relief = context.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, patchRadius);
          relief.addColorStop(0, `rgba(1, 22, 53, ${.16 + elevationRatio * .13})`);
          relief.addColorStop(.58, `rgba(4, 39, 76, ${.08 + elevationRatio * .08})`);
          relief.addColorStop(1, 'rgba(4, 39, 76, 0)');
          context.fillStyle = relief;
          context.beginPath(); context.ellipse(projected.x, projected.y, patchRadius * 1.35, patchRadius * .72, .28, 0, Math.PI * 2); context.fill();
        });
        context.restore();
        const drawMountainRing = (ring, rank, shade) => {
          let segment = [];
          const fillSegment = () => {
            if (segment.length < 3) return;
            context.beginPath();
            segment.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
            context.closePath();
            context.fillStyle = shade;
            context.shadowColor = 'rgba(2, 20, 48, .38)';
            context.shadowBlur = rank <= 2 ? 7 : 4;
            context.fill();
            segment = [];
          };
          ring.forEach(([latitude, longitude]) => {
            const projected = project(globePoint(latitude, longitude));
            if (projected.z > .04) segment.push(projected);
            else fillSegment();
          });
          fillSegment();
        };
        context.save();
        context.globalCompositeOperation = 'source-over';
        mountainRanges.forEach(range => {
          const shades = range.rank <= 1
            ? ['rgba(4, 34, 70, .34)', 'rgba(7, 43, 82, .31)', 'rgba(9, 51, 92, .28)']
            : ['rgba(7, 43, 82, .25)', 'rgba(10, 53, 96, .22)', 'rgba(15, 64, 108, .2)'];
          const shade = shades[(range.name.length + range.rank) % shades.length];
          range.rings.forEach(ring => drawMountainRing(ring, range.rank, shade));
        });
        context.restore();
      }
      // Keep live countries in the foreground so the relief and mountain overlays
      // cannot mute the neon prayer color.
      countryBorders.forEach(country => {
        if (!prayingCountryIds.has(country.id)) return;
        country.rings.forEach(ring => drawCountry(ring, true, country.id));
      });
      context.restore();
      context.save();
      context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.shadowColor = 'rgba(126, 231, 255, .72)'; context.shadowBlur = 6;
      context.strokeStyle = 'rgba(184, 246, 255, .86)'; context.lineWidth = .72; context.stroke();
      context.restore();
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [countryBorders, coastline, prayingCountryIds]);

  const move = event => {
    event.preventDefault();
    const rotation = rotationRef.current;
    if (!rotation.pointers.has(event.pointerId)) return;
    const deltaX = event.clientX - rotation.x;
    const deltaY = event.clientY - rotation.y;
    rotation.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (rotation.pointers.size === 1 && rotation.dragging) {
      rotation.yaw += deltaX * .012;
      rotation.pitch = Math.max(-1.2, Math.min(1.2, rotation.pitch + deltaY * .012));
      rotation.velocityX = deltaX * .0023;
      rotation.velocityY = deltaY * .0023;
      rotation.x = event.clientX; rotation.y = event.clientY;
    } else if (rotation.pointers.size === 2) {
      const [first, second] = [...rotation.pointers.values()];
      rotation.zoom = Math.max(.9, Math.min(1.75, rotation.pinchZoom * (Math.hypot(first.x - second.x, first.y - second.y) / rotation.pinchDistance)));
    }
  };
  const end = event => {
    event.preventDefault();
    const rotation = rotationRef.current;
    rotation.pointers.delete(event.pointerId);
    if (!rotation.pointers.size) { rotation.dragging = false; rotation.pointerId = null; }
    if (rotation.pointers.size === 1) {
      const remaining = [...rotation.pointers.values()][0];
      rotation.dragging = true; rotation.x = remaining.x; rotation.y = remaining.y;
    }
  };
  useEffect(() => {
    const handleMove = event => move(event);
    const handleEnd = event => end(event);
    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleEnd, { passive: false });
    window.addEventListener('pointercancel', handleEnd, { passive: false });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, []);
  const wheelZoom = event => {
    event.preventDefault();
    const rotation = rotationRef.current;
    rotation.zoom = Math.max(.9, Math.min(1.75, rotation.zoom * Math.exp(-event.deltaY * .001)));
    rotation.velocityX = 0; rotation.velocityY = 0;
  };
  const keyboardRotate = event => {
    const rotation = rotationRef.current;
    const amount = degrees(12);
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') rotation.yaw -= amount;
    if (event.key === 'ArrowRight') rotation.yaw += amount;
    if (event.key === 'ArrowUp') rotation.pitch = Math.max(-1.2, rotation.pitch - amount);
    if (event.key === 'ArrowDown') rotation.pitch = Math.min(1.2, rotation.pitch + amount);
  };
  return <canvas ref={canvasRef} className="intercession-globe-canvas" tabIndex={0} role="img" aria-label="Interactive 3D globe showing prayer activity by country. Drag, pinch, or use arrow keys to explore it." onPointerDown={event => {
    event.preventDefault();
    const rotation = rotationRef.current;
    rotation.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    rotation.dragging = rotation.pointers.size === 1; rotation.pointerId = event.pointerId; rotation.x = event.clientX; rotation.y = event.clientY; rotation.velocityX = 0; rotation.velocityY = 0;
    if (rotation.pointers.size === 2) { const [first, second] = [...rotation.pointers.values()]; rotation.pinchDistance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)); rotation.pinchZoom = rotation.zoom; }
  }} onContextMenu={event => event.preventDefault()} onWheel={wheelZoom} onKeyDown={keyboardRotate} />;
}

function PrayerGlobe({ activity }) {
  const countryCodes = activity.connected ? activity.countryCodes || [] : sampleCountries.map(country => country.code);
  const activeCountryNames = [...new Set(countryCodes)].map(countryLabel);
  const description = activity.connected
    ? `${activity.count} ${activity.count === 1 ? 'person' : 'people'} praying live${activeCountryNames.length ? ` from ${activeCountryNames.join(', ')}` : ', country not detected'}.`
    : 'Prayer activity preview using sample data.';
  return <section className="intercession-world-section" aria-labelledby="intercession-world-title">
    <h3 id="intercession-world-title">Where people are praying</h3>
    <div className="intercession-world" aria-label={description}>
      <div className="intercession-globe-shell"><InteractiveGlobe countryCodes={countryCodes} /></div>
      <div className="intercession-world-copy"><span className="intercession-live-dot" aria-hidden="true" /><span className="intercession-kicker">{activity.connected ? 'LIVE SESSION' : 'SESSION ACTIVITY'}</span><strong>{activity.connected ? activity.count : 76}</strong><span>{activity.connected ? `${activity.count === 1 ? 'person' : 'people'} connected now` : 'people praying · 7 countries'}</span>{!activity.connected && <small>Activity preview</small>}</div>
    </div>
  </section>;
}
const voteThemes = intercessionTopics;
function PrayerThemeCarousel({ voting, pending, message, onVote }) {
  return <section className="intercession-voting" aria-labelledby="intercession-vote-title">
    <div className="intercession-vote-heading"><h3 id="intercession-vote-title">Vote for the next prayer theme</h3></div>
    <div className="intercession-theme-carousel" id="intercession-theme-carousel">
      {voteThemes.map(theme => <button key={theme.id} type="button" style={{ '--vote-image': `url("assets/prayer-themes/${theme.id}.webp")` }} className={`intercession-vote-card intercession-vote-${theme.id}${voting?.ownVote === theme.id ? ' is-selected' : ''}`} aria-label={`Vote for ${theme.label}`} aria-pressed={voting?.ownVote === theme.id} disabled={pending || !voting?.signedIn} onClick={() => onVote(voting.ownVote === theme.id ? null : theme.id)}><strong>{theme.label}</strong><span className="intercession-vote-count">{voting ? `${voting.counts[theme.id] ?? 0} ${voting.counts[theme.id] === 1 ? 'vote' : 'votes'}` : '—'}</span><span className="intercession-vote-action">{voting?.ownVote === theme.id ? '✓ Voted' : 'Vote'}</span></button>)}
    </div>
    <div className="intercession-vote-feedback" role="status">{message || (voting ? voting.signedIn ? voting.ownVote ? 'Your vote is saved for the next session.' : '' : 'Sign in to vote for the next session.' : 'Loading community votes…')}{voting && !voting.signedIn && <button type="button" data-nav="profile">Sign in</button>}</div>
  </section>;
}
const prayerLineColors = ['#a8dcc8', '#cbb9ff', '#9fd5ff', '#ffcda9', '#f6b7d3'];

function TypewriterPrayerText({ text, animate }) {
  const shouldReduceMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const [displayed, setDisplayed] = useState(() => animate && !shouldReduceMotion() ? '' : text);
  const [typing, setTyping] = useState(() => animate && !shouldReduceMotion());
  useEffect(() => {
    if (!animate || shouldReduceMotion() || text.length < 2) {
      setDisplayed(text);
      setTyping(false);
      return undefined;
    }
    let index = 0;
    setDisplayed('');
    setTyping(true);
    const interval = window.setInterval(() => {
      index = Math.min(text.length, index + Math.max(1, Math.ceil(text.length / 70)));
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(interval);
        setTyping(false);
      }
    }, 18);
    return () => window.clearInterval(interval);
  }, [text, animate]);
  return <p className={typing ? 'is-typing' : undefined}>{displayed}</p>;
}

function BrotherPrayerJournal({ themeId, sessionStartsAt, now, onClockSync, topicSeconds, active = true }) {
  const [catalogue, setCatalogue] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);
  const following = useRef(true);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogue(null);
    setError('');
    const startedAt = Date.now();
    const endpoint = window.apiUrl?.(`/api/prayer/intercession-journal?themeId=${encodeURIComponent(themeId)}`) || `/api/prayer/intercession-journal?themeId=${encodeURIComponent(themeId)}`;
    fetch(endpoint, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error('Guided prayer is temporarily unavailable.');
      if (controller.signal.aborted) return;
      const lines = validatePrayerJournal(themeId, data.lines);
      onClockSync(data.serverTime, startedAt);
      setCatalogue({ themeId, lines });
    }).catch(next => { if (!controller.signal.aborted) setError(next.message); });
    return () => controller.abort();
  }, [themeId, sessionStartsAt, attempt, onClockSync]);
  const slot = Math.floor((now - sessionStartsAt) / PRAYER_LINE_MS);
  const journalTopics = getPrayerTopics(themeId);
  const focusIndex = Math.max(0, Math.min(journalTopics.length - 1, Math.floor(slot / PRAYER_LINES_PER_FOCUS)));
  const currentFocusId = journalTopics[focusIndex]?.id;
  const messages = useMemo(() => catalogue?.themeId === themeId
    ? getPublishedPrayerLines(themeId, catalogue.lines, sessionStartsAt, sessionStartsAt + slot * PRAYER_LINE_MS)
      .filter(message => message.focusId === currentFocusId) : [],
    [catalogue, themeId, sessionStartsAt, slot, currentFocusId]);
  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);
  const latest = messages.at(-1);
  useEffect(() => { following.current = true; setPaused(false); }, [themeId, sessionStartsAt, currentFocusId]);
  useEffect(() => {
    if (following.current && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [latest?.id]);
  const jumpToLatest = () => {
    following.current = true;
    setPaused(false);
    scrollRef.current.scrollTop = 0;
  };
  return <section className="intercession-journal" aria-labelledby="intercession-journal-title">
    <header className="intercession-journal-heading"><div><span className="intercession-journal-dot" aria-hidden="true" /><h3 id="intercession-journal-title">Brother AI</h3><span>Guided prayer</span></div><div className="intercession-journal-tools"><span className="intercession-journal-topic-timer">Changes in {formatIntercessionTime(topicSeconds)}</span>{paused && <button type="button" tabIndex={active ? 0 : -1} onClick={jumpToLatest}>Latest ↑</button>}</div></header>
    <div className="intercession-journal-log" role="log" aria-labelledby="intercession-journal-title" aria-live="off" tabIndex={active ? 0 : -1} ref={scrollRef} onScroll={() => {
      const element = scrollRef.current;
      following.current = element.scrollTop < 20;
      setPaused(!following.current);
    }}>
      {error ? <div className="intercession-journal-empty"><p>Guided prayer is temporarily unavailable.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : !catalogue ? <p className="intercession-journal-empty" role="status">Preparing the prayer…</p> : <ol>{displayMessages.map((message, index) => <li key={message.id}>{(index === 0 || displayMessages[index - 1].focusId !== message.focusId) && <span className="intercession-journal-focus">{message.focusTitle}</span>}<div className={`intercession-journal-message${index === 0 ? ' is-new' : ''}`} style={{ '--prayer-line-color': prayerLineColors[Math.floor(message.elapsedSeconds / 10) % prayerLineColors.length] }}><TypewriterPrayerText text={message.body} animate={index === 0} /><time dateTime={new Date(message.publishedAt).toISOString()}>{formatIntercessionTime(message.elapsedSeconds)}</time></div></li>)}</ol>}
    </div>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{latest ? `Brother AI: ${latest.body}` : ''}</p>
  </section>;
}

function SessionReminderDialog({ schedule, onChange, onSave, onClose, onBack, saving, message }) {
  const [activeDay, setActiveDay] = useState('mon');
  const selectedSlots = schedule.days[activeDay] || [];
  const toggleSlot = slot => {
    const nextSlots = selectedSlots.includes(slot) ? selectedSlots.filter(value => value !== slot) : [...selectedSlots, slot].sort();
    onChange(normalizeReminderSchedule({ ...schedule, days: { ...schedule.days, [activeDay]: nextSlots } }));
  };
  return <section className="intercession-session-dialog intercession-reminder-dialog" role="dialog" aria-modal="true" aria-labelledby="intercession-reminder-title" aria-describedby="intercession-reminder-description">
    <button type="button" className="intercession-session-close" onClick={onClose} aria-label="Close">×</button>
    <h2 id="intercession-reminder-title">Session reminders</h2>
    <p id="intercession-reminder-description">Choose the moments you want a gentle reminder to join the 10-minute prayer.</p>
    <div className="intercession-reminder-calendar" aria-label="Choose a day for prayer reminders">
      {reminderDays.map(day => <button type="button" key={day.id} className={schedule.days[day.id]?.length ? 'has-slots' : ''} aria-pressed={activeDay === day.id} onClick={() => setActiveDay(day.id)}><span>{day.short}</span><small>{day.label}</small></button>)}
    </div>
    <div className="intercession-reminder-day-heading"><strong>{reminderDays.find(day => day.id === activeDay)?.label}</strong><span>{selectedSlots.length ? `${selectedSlots.length} selected` : 'Choose times'}</span></div>
    <div className="intercession-reminder-slots" aria-label={`Prayer reminder times for ${activeDay}`}>
      {reminderSlots.map(slot => <button type="button" key={slot} className={selectedSlots.includes(slot) ? 'is-selected' : ''} aria-pressed={selectedSlots.includes(slot)} onClick={() => toggleSlot(slot)}>{slot}</button>)}
    </div>
    <p className="intercession-reminder-timezone">Times use your device timezone · {schedule.timeZone}</p>
    {message && <p className="intercession-reminder-message" role="status">{message}</p>}
    <div className="intercession-session-dialog-actions"><button type="button" className="intercession-session-dialog-secondary" onClick={onBack}>Back</button><button type="button" className="intercession-session-dialog-primary" disabled={saving || !countReminderSlots(schedule)} onClick={onSave}>{saving ? 'Saving…' : 'Save reminders'}</button></div>
  </section>;
}

export function IntercessionPanel() {
  const clockOffset = useRef(0);
  const [store] = useState(() => createIntercessionStore(window.localStorage, () => Date.now() + clockOffset.current));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [now, setNow] = useState(Date.now);
  const syncClock = useCallback((serverTime, startedAt) => {
    if (!Number.isFinite(serverTime)) return;
    const receivedAt = Date.now();
    clockOffset.current = serverTime - (startedAt + receivedAt) / 2;
    setNow(receivedAt + clockOffset.current);
  }, []);
  const schedule = getGlobalIntercessionSchedule(now);
  const sessionStart = schedule.sessionStartsAt;
  const [voting, setVoting] = useState(null);
  const [pendingVote, setPendingVote] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const votingRequest = useRef(0);
  const voteInFlight = useRef(false);
  useEffect(() => {
    let active = true;
    setVoteMessage('');
    const refresh = async () => {
      if (voteInFlight.current) return;
      const request = ++votingRequest.current;
      try {
        const startedAt = Date.now();
        const next = await window.prayerBridge.intercessionVotes();
        if (active && request === votingRequest.current) { syncClock(next.serverTime, startedAt); setVoting(next); setVoteMessage(''); }
      } catch {
        if (active && request === votingRequest.current) setVoteMessage('Community voting is unavailable. Please try again shortly.');
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 10_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [sessionStart, syncClock]);
  const vote = async topicId => {
    if (voteInFlight.current) return;
    voteInFlight.current = true;
    ++votingRequest.current;
    setPendingVote(true);
    setVoteMessage('Saving your vote…');
    try {
      const next = await window.prayerBridge.intercessionVotes({ topicId, nextSessionStart: schedule.sessionEndsAt });
      setVoting(next);
      setVoteMessage(topicId === null ? 'Your vote has been removed.' : 'Your vote is saved for the next session.');
    } catch (error) { setVoteMessage(error.message); }
    finally { voteInFlight.current = false; setPendingVote(false); }
  };
  const [activity, setActivity] = useState({ connected: false, count: 0 });
  const [reminderSchedule, setReminderSchedule] = useState(() => readReminderSchedule(window.localStorage));
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [remoteStats, setRemoteStats] = useState(null);
  useEffect(() => {
    const refresh = () => { store.tick(); setNow(Date.now() + clockOffset.current); };
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    refresh();
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [store]);
  useEffect(() => {
    let dispose;
    let active = true;
    createIntercessionPresence(next => { if (active) setActivity(next); }).then(cleanup => { if (active) dispose = cleanup; else cleanup(); }).catch(() => {});
    return () => { active = false; dispose?.(); };
  }, []);
  useEffect(() => {
    let active = true;
    Promise.resolve(window.prayerBridge?.intercessionReminders?.()).then(data => {
      if (!active || !data?.schedule) return;
      const next = writeReminderSchedule(window.localStorage, { timeZone: data.timeZone, days: data.schedule });
      setReminderSchedule(next);
    }).catch(() => {});
    Promise.resolve(window.prayerBridge?.intercessionSessions?.()).then(data => { if (active && data) setRemoteStats(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const syncedSessionRef = useRef('');
  useEffect(() => {
    const session = state.session;
    if (!session?.completed || !Number.isFinite(session.durationSeconds) || !Number.isFinite(session.finishedAt)) return;
    const syncKey = `${session.startedAt}:${session.finishedAt}`;
    if (syncedSessionRef.current === syncKey) return;
    syncedSessionRef.current = syncKey;
    Promise.resolve(window.prayerBridge?.intercessionSessions?.({
      themeId: session.topicId,
      startedAt: new Date(session.startedAt).toISOString(),
      finishedAt: new Date(session.finishedAt).toISOString(),
      durationSeconds: session.durationSeconds,
    })).then(data => { if (data) setRemoteStats(data); }).catch(() => {});
  }, [state.session]);
  const lastReminderNotification = useRef('');
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!reminderSchedule || !('Notification' in window) || Notification.permission !== 'granted') return;
      const current = new Date();
      const day = reminderDays[(current.getDay() + 6) % 7];
      const slot = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
      const key = `${current.toISOString().slice(0, 10)}:${slot}`;
      if (reminderSchedule.days[day.id]?.includes(slot) && lastReminderNotification.current !== key) {
        lastReminderNotification.current = key;
        new Notification('Prayer room reminder', { body: `The ${slot} global prayer session is starting now.` });
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [reminderSchedule]);
  const { phase } = getIntercessionPhase(state.session, now);
  const topicIndex = schedule.familyTopicIndex;
  const themeId = voting?.sessionStart === sessionStart ? voting.currentTheme : 'families';
  const theme = voteThemes.find(item => item.id === themeId) || voteThemes[0];
  const topics = getPrayerTopics(themeId);
  const topic = topics[topicIndex];
  const nextTopic = topics[(topicIndex + 1) % topics.length];
  const joined = phase === 'praying' && Boolean(state.session?.endsAt);
  const [sessionDialog, setSessionDialog] = useState(null);
  const [prayerSlide, setPrayerSlide] = useState(0);
  const prayerCarouselRef = useRef(null);
  const intercessionEntered = useRef(false);
  useEffect(() => {
    if (intercessionEntered.current) return;
    intercessionEntered.current = true;
    if (!joined) setSessionDialog('join');
  }, [joined]);
  useEffect(() => { setPrayerSlide(0); prayerCarouselRef.current?.scrollTo({ left: 0, behavior: 'auto' }); }, [themeId, sessionStart]);
  useEffect(() => {
    if (!sessionDialog) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') setSessionDialog(null); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [sessionDialog]);
  const selectPrayerSlide = index => {
    setPrayerSlide(index);
    const carousel = prayerCarouselRef.current;
    if (carousel) carousel.scrollTo({ left: index * carousel.clientWidth, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const totalPrayerSeconds = Math.max(state.prayerSeconds || 0, remoteStats?.totalSeconds || 0);
  const completedSessions = Math.max(state.count || 0, remoteStats?.sessionCount || 0);
  const saveReminders = async () => {
    if (!countReminderSlots(reminderSchedule)) {
      setReminderMessage('Select at least one day and time.');
      return;
    }
    setReminderSaving(true);
    setReminderMessage('');
    const next = writeReminderSchedule(window.localStorage, reminderSchedule);
    setReminderSchedule(next);
    try {
      if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
      await window.prayerBridge?.intercessionReminders?.({ timeZone: next.timeZone, schedule: next.days });
      setReminderMessage('Reminders saved for your weekly rhythm.');
    } catch (error) {
      setReminderMessage(error?.status === 401 ? 'Saved on this device. Sign in to sync across devices.' : 'Saved on this device. We could not sync it yet.');
    } finally {
      setReminderSaving(false);
    }
  };
  const returnToPrayer = useCallback(() => {
    setSessionDialog(null);
    window.prayerBridge?.setPageTab?.('board');
  }, []);
  const dismissSessionDialog = () => {
    if (sessionDialog === 'join' || sessionDialog === 'reminders') returnToPrayer();
    else setSessionDialog(null);
  };
  return <section className="intercession-panel" aria-labelledby="intercession-title">
    {joined && <div className="intercession-top-actions"><div className="intercession-session-elapsed" role="status" aria-label={`You are praying since ${formatPrayerDuration(Math.max(0, Math.floor((now - (state.session?.startedAt || now)) / 1000)))}`}><span>You are praying since</span><strong>{formatPrayerDuration(Math.max(0, Math.floor((now - (state.session?.startedAt || now)) / 1000)))}</strong></div><button className="intercession-session-finish" type="button" aria-haspopup="dialog" onClick={() => setSessionDialog('finish')}>Finish the prayer</button></div>}
    <div className="intercession-prayer-carousel" aria-label="Prayer focus and guided prayer">
      <div className="intercession-prayer-indicators" role="tablist" aria-label="Prayer views">
        {['Prayer focus', 'Guided prayer'].map((label, index) => <button key={label} id={`intercession-view-tab-${index}`} type="button" role="tab" aria-selected={prayerSlide === index} aria-controls={`intercession-view-panel-${index}`} className={prayerSlide === index ? 'is-active' : ''} onClick={() => selectPrayerSlide(index)}><span aria-hidden="true" />{label}</button>)}
      </div>
      <div className="intercession-prayer-viewport" ref={prayerCarouselRef} onScroll={event => {
        const width = event.currentTarget.clientWidth || 1;
        const next = Math.max(0, Math.min(1, Math.round(event.currentTarget.scrollLeft / width)));
        setPrayerSlide(value => value === next ? value : next);
      }}>
        <div className="intercession-prayer-track">
          <div id="intercession-view-panel-0" role="tabpanel" aria-labelledby="intercession-view-tab-0" aria-hidden={prayerSlide !== 0} className="intercession-prayer-slide">
            <div className="intercession-focus-card">
              <header className="intercession-theme-row">
                <div><span className="intercession-kicker">THE THEME IS</span><h2 id="intercession-title">{theme.label}</h2></div>
                <div className="intercession-clock"><span>Next session · {formatIntercessionClock(schedule.sessionEndsAt)}</span><strong role="timer" aria-label="Time remaining in the global session">{formatIntercessionTime(schedule.nextSessionSeconds)}</strong></div>
              </header>
              <div className="intercession-subject-row"><span className="intercession-kicker">PRAYER FOCUS · {topicIndex + 1} / {topics.length}</span><div className="intercession-clock"><span>Changes in</span><strong role="timer" aria-label="Time until the next prayer focus">{formatIntercessionTime(schedule.nextTopicSeconds)}</strong></div></div>
              <div key={topic.id} className="intercession-current-focus" aria-live="polite" aria-atomic="true"><h3>{topic.title}</h3><p>{topic.detail}</p></div>
              <div className="intercession-progress" aria-label={`Prayer focus ${topicIndex + 1} of ${topics.length}`}>
                {topics.map((item, index) => <span key={item.id} className={index < topicIndex ? 'is-complete' : index === topicIndex ? 'is-current' : ''}><span style={{ width: `${index < topicIndex ? 100 : index === topicIndex ? schedule.topicProgress * 100 : 0}%` }} /></span>)}
              </div>
              <p className="intercession-next">Up next: <span>{nextTopic.title}</span></p>
              {!joined && <button className="intercession-primary" tabIndex={prayerSlide === 0 ? 0 : -1} type="button" aria-haspopup="dialog" onClick={() => setSessionDialog('join')}>{phase === 'complete' ? 'Pray again' : 'Join prayer'}</button>}
            </div>
          </div>
          <div id="intercession-view-panel-1" role="tabpanel" aria-labelledby="intercession-view-tab-1" aria-hidden={prayerSlide !== 1} className="intercession-prayer-slide">
            <BrotherPrayerJournal themeId={themeId} sessionStartsAt={sessionStart} now={now} topicSeconds={schedule.nextTopicSeconds} active={prayerSlide === 1} onClockSync={syncClock} />
          </div>
        </div>
      </div>
    </div>
    <PrayerThemeCarousel voting={voting?.sessionStart === sessionStart ? voting : null} pending={pendingVote} message={voteMessage} onVote={vote} />
    <PrayerGlobe activity={activity} />
    <p className="intercession-personal">{completedSessions} completed {completedSessions === 1 ? 'session' : 'sessions'} · {formatPrayerDuration(totalPrayerSeconds)} prayed</p>
    {sessionDialog && createPortal(<div className="intercession-session-modal" role="presentation" onMouseDown={event => event.target === event.currentTarget && dismissSessionDialog()}>{sessionDialog === 'reminders' ? <SessionReminderDialog schedule={reminderSchedule} onChange={setReminderSchedule} onSave={saveReminders} onClose={returnToPrayer} onBack={() => { setReminderMessage(''); setSessionDialog('join'); }} saving={reminderSaving} message={reminderMessage} /> : <section className="intercession-session-dialog" role="dialog" aria-modal="true" aria-labelledby="intercession-session-dialog-title" aria-describedby="intercession-session-dialog-description"><button type="button" className="intercession-session-close" onClick={sessionDialog === 'join' ? returnToPrayer : () => setSessionDialog(null)} aria-label="Close">×</button><span className="intercession-kicker">{sessionDialog === 'join' ? 'GLOBAL INTERCESSION' : sessionDialog === 'summary' ? 'PRAYER COMPLETE' : 'SESSION ACTIVE'}</span><h2 id="intercession-session-dialog-title">{sessionDialog === 'join' ? 'Join the global prayer?' : sessionDialog === 'summary' ? 'Your prayer time is counted.' : 'Finish this prayer session?'}</h2><p id="intercession-session-dialog-description">{sessionDialog === 'join' ? 'Follow this prayer focus with everyone connected in the room.' : sessionDialog === 'summary' ? 'Thank you for making space to pray with the global room.' : 'Your session will be marked complete on this device.'}</p><div className="intercession-session-dialog-details">{sessionDialog === 'summary' ? <><span className="intercession-session-stat"><strong>{formatPrayerDuration(state.session?.durationSeconds || 0)}</strong><small>this session</small></span><span className="intercession-session-stat"><strong>{formatPrayerDuration(totalPrayerSeconds)}</strong><small>total prayer time</small></span></> : <><span>{theme.label}</span><span>{topic.title}</span><span>{`10-minute session · next topic in ${formatIntercessionTime(schedule.nextTopicSeconds)}`}</span></>}</div>{sessionDialog === 'join' && <button type="button" className="intercession-session-reminder-link" onClick={() => { setReminderMessage(''); setSessionDialog('reminders'); }}>Set session reminders</button>}<div className="intercession-session-dialog-actions"><button type="button" className="intercession-session-dialog-secondary" aria-label={sessionDialog === 'join' ? 'Not now' : 'Close'} onClick={sessionDialog === 'join' ? returnToPrayer : () => setSessionDialog(null)}>{sessionDialog === 'join' ? 'Not now' : '×'}</button>{sessionDialog !== 'summary' && <button type="button" className="intercession-session-dialog-primary" onClick={() => { if (sessionDialog === 'join') { store.joinGlobal(themeId); setSessionDialog(null); } else { const result = store.finishGlobal(); if (result) setSessionDialog('summary'); } setNow(Date.now() + clockOffset.current); }}>{sessionDialog === 'join' ? 'Join prayer' : 'Finish session'}</button>}</div></section>}</div>, document.querySelector('.phone-frame') || document.body)}
  </section>;
}
