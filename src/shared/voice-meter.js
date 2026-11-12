// The meter reads local microphone frequencies only; no audio is saved or sent.
export function startVoiceMeter({ getStream, createContext, requestFrame, cancelFrame, onLevels, onUnavailable = () => {}, barCount = 18 }) {
  let disposed = false;
  let stream;
  let context;
  let source;
  let analyser;
  let frame;
  function release() {
    if (frame !== undefined) cancelFrame(frame);
    source?.disconnect();
    analyser?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    frame = undefined;
    source = analyser = stream = context = null;
  }
  void (async () => {
    try {
      stream = await getStream();
      // Permissions can resolve after the user has already stopped dictation.
      if (disposed) { release(); return; }
      context = createContext();
      analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = .65;
      source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      await context.resume();
      if (disposed) return;
      const frequencies = new Uint8Array(analyser.frequencyBinCount);
      const levels = new Float32Array(barCount);
      const binHz = context.sampleRate / analyser.fftSize;
      const maxHz = Math.min(8000, context.sampleRate / 2);
      function draw() {
        if (disposed) return;
        analyser.getByteFrequencyData(frequencies);
        // Logarithmic bands show both low voices and higher speech frequencies.
        for (let bar = 0; bar < barCount; bar++) {
          const first = Math.floor(100 * (maxHz / 100) ** (bar / barCount) / binHz);
          const last = Math.min(frequencies.length, Math.max(first + 1, Math.ceil(100 * (maxHz / 100) ** ((bar + 1) / barCount) / binHz)));
          let energy = 0;
          for (let bin = first; bin < last; bin++) energy += frequencies[bin] ** 2;
          levels[bar] = Math.sqrt(energy / (last - first)) / 255;
        }
        onLevels(levels);
        frame = requestFrame(draw);
      }
      draw();
    } catch {
      release();
      if (!disposed) onUnavailable();
    }
  })();
  return () => { disposed = true; release(); };
}
