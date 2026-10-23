import { useCallback, useEffect, useRef, useState } from "react";

const BASE_GAIN = 0.07;
const DUCK_GAIN = 0.012;

export interface RoomToneController {
  enabled: boolean;
  ducked: boolean;
  level: number;
  toggle: () => void;
}

function buildBrownNoise(context: AudioContext): AudioBuffer {
  const seconds = 6;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.018 * white) / 1.018;
    data[index] = last * 3.2;
  }
  return buffer;
}

/**
 * A small, generated room tone. Nothing is streamed or licensed: brown noise
 * plus a low hum, ducked while a care card is on screen. Audio only starts
 * after an explicit user gesture, per browser autoplay rules.
 */
export function useRoomTone(shouldDuck: boolean): RoomToneController {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const suspendTimer = useRef<number | null>(null);
  const duckRef = useRef(shouldDuck);
  duckRef.current = shouldDuck;

  const ramp = useCallback((value: number, seconds: number) => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(value, now, Math.max(0.02, seconds / 3));
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (suspendTimer.current) {
      window.clearTimeout(suspendTimer.current);
      suspendTimer.current = null;
    }

    let context = contextRef.current;
    if (!context) {
      const AudioConstructor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioConstructor) return false;

      context = new AudioConstructor();
      contextRef.current = context;

      const master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);
      masterRef.current = master;

      const noise = context.createBufferSource();
      noise.buffer = buildBrownNoise(context);
      noise.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 460;
      filter.Q.value = 0.4;

      const noiseGain = context.createGain();
      noiseGain.gain.value = 0.8;

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();

      const hum = context.createOscillator();
      hum.type = "sine";
      hum.frequency.value = 58;
      const humGain = context.createGain();
      humGain.gain.value = 0.018;
      hum.connect(humGain);
      humGain.connect(master);
      hum.start();
    }

    if (context.state === "suspended") {
      await context.resume();
    }
    ramp(duckRef.current ? DUCK_GAIN : BASE_GAIN, 1.4);
    return true;
  }, [ramp]);

  const toggle = useCallback(() => {
    if (enabled) {
      ramp(0, 0.4);
      setEnabled(false);
      suspendTimer.current = window.setTimeout(() => {
        void contextRef.current?.suspend().catch(() => undefined);
      }, 480);
      return;
    }
    void start().then((ok) => {
      if (ok) setEnabled(true);
    });
  }, [enabled, ramp, start]);

  useEffect(() => {
    if (!enabled) return;
    ramp(shouldDuck ? DUCK_GAIN : BASE_GAIN, 0.9);
  }, [enabled, shouldDuck, ramp]);

  useEffect(() => {
    return () => {
      if (suspendTimer.current) window.clearTimeout(suspendTimer.current);
      void contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
      masterRef.current = null;
    };
  }, []);

  return {
    enabled,
    ducked: shouldDuck,
    level: enabled ? (shouldDuck ? 20 : 100) : 0,
    toggle
  };
}
