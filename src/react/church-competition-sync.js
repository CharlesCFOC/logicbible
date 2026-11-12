import { competitionRequest } from './church-competition-client.js';

// Bounded requests keep one interrupted fetch from stopping all future updates.
export function subscribeCompetition({ room, token, onRoom, onError }, {
  request = competitionRequest, events = window, visibility = document,
  schedule = setTimeout, cancel = clearTimeout,
} = {}) {
  let stopped = false, active = false, repeat = false, timer, controller;
  const refresh = async () => {
    if (stopped) return;
    if (active) { repeat = true; return; }
    cancel(timer); active = true; repeat = false;
    controller = new AbortController();
    try {
      const next = await request({ room, token, signal: controller.signal });
      if (!stopped) onRoom(next);
    } catch (error) {
      if (!stopped) {
        onError(error);
        if ([404, 410].includes(error.status)) stop();
      }
    } finally {
      active = false;
      if (!stopped) timer = schedule(refresh, repeat ? 0 : visibility.hidden ? 3000 : 1000);
    }
  };
  const wake = () => { if (!visibility.hidden) void refresh(); };
  function stop() {
    stopped = true; cancel(timer); controller?.abort();
    events.removeEventListener('focus', wake);
    events.removeEventListener('online', wake);
    visibility.removeEventListener('visibilitychange', wake);
  }
  events.addEventListener('focus', wake);
  events.addEventListener('online', wake);
  visibility.addEventListener('visibilitychange', wake);
  void refresh();
  return stop;
}
