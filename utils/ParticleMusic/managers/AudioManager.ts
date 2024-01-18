import { buffer } from "stream/consumers";
import * as THREE from "three";

interface FrequencyData {
  low: number;
  mid: number;
  high: number;
}

export default class AudioManager {
  frequencyArray: number[];
  frequencyData: FrequencyData;
  isPlaying: boolean;
  lowFrequency: number;
  midFrequency: number;
  highFrequency: number;
  smoothedLowFrequency: number;
  audioContext: AudioContext | null;
  audio: THREE.Audio;
  bufferLength: number;
  audioAnalyser: THREE.AudioAnalyser;
  song: { url: string };

  constructor() {
    this.frequencyArray = [];
    this.frequencyData = {
      low: 0,
      mid: 0,
      high: 0,
    };

    this.isPlaying = false;
    this.lowFrequency = 10; //10Hz to 250Hz
    this.midFrequency = 150; //150Hz to 2000Hz
    this.highFrequency = 9000; //2000Hz to 20000Hz
    this.smoothedLowFrequency = 0;
    this.audioContext = null;

    this.song = {
      url: "https://p.scdn.co/mp3-preview/3be3fb77f5b2945c95e86d4c40ceceac20e5108f?cid=b62f0af3b0d54eca9bb49b99a2fc5820",
    };

    this.audio = new THREE.Audio(new THREE.AudioListener());
    this.bufferLength = 0;
    this.audioAnalyser = new THREE.AudioAnalyser(this.audio, 1024);
  }

  async loadAudioBuffer(): Promise<void> {
    // Load the audio file and create the audio buffer
    return new Promise(async (resolve, reject) => {
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(this.song.url, (buffer) => {
        this.audio.setBuffer(buffer);
        this.audio.setLoop(true);
        this.audio.setVolume(0.5);
        this.audioContext = this.audio.context;
        this.bufferLength = this.audioAnalyser.data.length;
        resolve();
      });
    });
  }

  play(): void {
    this.audio.play();
    this.isPlaying = true;
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
  }

  stop(): void {
    this.audio.stop();
    this.isPlaying = false;
  }

  collectAudioData(): void {
    this.frequencyArray = Array.from(this.audioAnalyser.getFrequencyData());
  }

  analyzeFrequency(): void {
    // Calculate the average frequency value for each range of frequencies
    const lowFreqRangeStart = Math.floor(
      (this.lowFrequency * this.bufferLength) / this.audioContext?.sampleRate!
    );
    const lowFreqRangeEnd = Math.floor(
      (this.midFrequency * this.bufferLength) / this.audioContext?.sampleRate!
    );
    const midFreqRangeStart = Math.floor(
      (this.midFrequency * this.bufferLength) / this.audioContext?.sampleRate!
    );
    const midFreqRangeEnd = Math.floor(
      (this.highFrequency * this.bufferLength) / this.audioContext?.sampleRate!
    );
    const highFreqRangeStart = Math.floor(
      (this.highFrequency * this.bufferLength) / this.audioContext?.sampleRate!
    );
    const highFreqRangeEnd = this.bufferLength - 1;

    const lowAvg = this.normalizeValue(
      this.calculateAverage(
        this.frequencyArray,
        lowFreqRangeStart,
        lowFreqRangeEnd
      )
    );
    const midAvg = this.normalizeValue(
      this.calculateAverage(
        this.frequencyArray,
        midFreqRangeStart,
        midFreqRangeEnd
      )
    );
    const highAvg = this.normalizeValue(
      this.calculateAverage(
        this.frequencyArray,
        highFreqRangeStart,
        highFreqRangeEnd
      )
    );

    this.frequencyData = {
      low: lowAvg,
      mid: midAvg,
      high: highAvg,
    };
  }

  calculateAverage(array: number[], start: number, end: number): number {
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += array[i];
    }
    return sum / (end - start + 1);
  }

  normalizeValue(value: number): number {
    // Assuming the frequency values are in the range 0-256 (for 8-bit data)
    return value / 256;
  }

  update(): void {
    if (!this.isPlaying) return;

    this.collectAudioData();
    this.analyzeFrequency();
  }
}
