export function startBibleVoiceRecorder({
  getStream,
  createRecorder,
  createAudioContext,
  requestFrame,
  cancelFrame,
  onLevels = () => {},
  onReady = () => {},
  onSilence = () => {},
  silenceMs = 2000,
  maxDurationMs = 30_000,
}) {
  let stream;
  let context;
  let source;
  let analyser;
  let recorder;
  let frame;
  let maxTimer;
  let cancelled = false;
  let stopped = false;
  let disposed = false;
  let hasVoice = false;
  let quietSince = null;
  let lastLevelUpdate = 0;
  const chunks = [];

  const release = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== undefined) cancelFrame(frame);
    clearTimeout(maxTimer);
    source?.disconnect();
    analyser?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    if (context && context.state !== "closed") void context.close().catch(() => {});
  };

  const done = new Promise((resolve, reject) => {
    let streamPromise;
    try {
      context = createAudioContext();
      void context.resume().catch(() => {});
      streamPromise = getStream();
    } catch (error) {
      reject(error);
      return;
    }
    Promise.resolve(streamPromise).then(async audioStream => {
      stream = audioStream;
      if (cancelled) { stream.getTracks().forEach(track => track.stop()); release(); resolve(null); return; }
      try {
        recorder = createRecorder(stream);
        analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = .65;
        source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        await context.resume();
        if (cancelled) { release(); resolve(null); return; }
        recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
        recorder.onerror = event => { release(); reject(event.error || new Error("Voice recording failed.")); };
        recorder.onstop = () => {
          const blob = cancelled ? null : new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          release();
          resolve(blob);
        };
        recorder.start(250);
        onReady();
        maxTimer = setTimeout(() => stop(), maxDurationMs);
        const waveform = new Uint8Array(analyser.frequencyBinCount);
        const voiceSignal = new Uint8Array(analyser.fftSize);
        const draw = now => {
          if (disposed || stopped) return;
          analyser.getByteFrequencyData(waveform);
          analyser.getByteTimeDomainData(voiceSignal);
          let energy = 0;
          for (const sample of voiceSignal) {
            const normalized = (sample - 128) / 128;
            energy += normalized * normalized;
          }
          const rms = Math.sqrt(energy / voiceSignal.length);
          if (rms >= .018) {
            hasVoice = true;
            quietSince = null;
          } else if (hasVoice) {
            quietSince ??= now;
            if (now - quietSince >= silenceMs) {
              onSilence();
              stop();
              return;
            }
          }
          if (now - lastLevelUpdate >= 50) {
            const levels = new Array(18);
            for (let bar = 0; bar < levels.length; bar++) {
              const first = Math.floor(100 * (8000 / 100) ** (bar / levels.length) / (context.sampleRate / analyser.fftSize));
              const last = Math.min(waveform.length, Math.max(first + 1, Math.ceil(100 * (8000 / 100) ** ((bar + 1) / levels.length) / (context.sampleRate / analyser.fftSize))));
              let barEnergy = 0;
              for (let bin = first; bin < last; bin++) barEnergy += waveform[bin] ** 2;
              levels[bar] = Math.sqrt(barEnergy / Math.max(1, last - first)) / 255;
            }
            onLevels(levels);
            lastLevelUpdate = now;
          }
          frame = requestFrame(draw);
        };
        frame = requestFrame(draw);
      } catch (error) {
        release();
        reject(error);
      }
    }, error => { release(); reject(error); });
  });

  function stop() {
    if (stopped || disposed) return;
    stopped = true;
    if (!recorder) { cancelled = true; return; }
    if (recorder.state !== "recording") { cancelled = true; return; }
    try {
      recorder.stop();
    } catch {
      release();
    }
  }

  function cancel() {
    cancelled = true;
    stop();
  }

  return { done, stop, cancel };
}
