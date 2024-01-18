import { EventDispatcher, BaseEvent } from "three";
import { guess } from "web-audio-beat-detector";

interface BPMManagerEventMap {
  beat: void;
}

export default class BPMManager extends EventDispatcher<BPMManagerEventMap> {
  private interval: number;
  private intervalId: NodeJS.Timeout | null;
  private bpmValue: number;

  constructor() {
    super();
    // Initialization of beat management variables
    this.interval = 500; // Interval for beat events
    this.intervalId = null; // Timer ID for beat interval
    this.bpmValue = 0; // BPM value
  }

  setBPM(bpm: number): void {
    // Sets BPM and starts interval to emit beat events
    this.interval = 60000 / bpm;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(this.updateBPM.bind(this), this.interval);
  }

  private updateBPM(): void {
    // Function called at each beat interval
    // this.dispatchEvent({ type: 'beat' } as BaseEvent);
    this.dispatchEvent({ type: "beat" } as BaseEvent<"beat"> & void);
  }

  async detectBPM(audioBuffer: AudioBuffer): Promise<void> {
    // Analyzes the audio buffer to detect and set BPM
    const { bpm } = await guess(audioBuffer);
    this.setBPM(bpm);
    console.log(`BPM detected: ${bpm}`);
  }

  getBPMDuration(): number {
    // Returns the duration of one beat
    return this.interval;
  }
}
