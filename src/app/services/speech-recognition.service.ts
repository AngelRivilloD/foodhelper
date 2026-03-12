import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SpeechEvent } from '../models/voice.model';

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {

  readonly isSupported: boolean;

  private recognition: any;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private volumeFrameId: number | null = null;
  private events$ = new Subject<SpeechEvent>();

  constructor(private ngZone: NgZone) {
    const win = window as any;
    this.isSupported = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  startListening(): Observable<SpeechEvent> {
    if (!this.isSupported) {
      this.events$.next({ type: 'error', error: 'not-supported' });
      return this.events$.asObservable();
    }

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.ngZone.run(() => this.events$.next({ type: 'listening' }));
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim();

      this.ngZone.run(() => {
        if (interimTranscript) {
          this.events$.next({ type: 'interim', transcript: fullTranscript });
        } else {
          this.events$.next({ type: 'result', transcript: finalTranscript.trim(), confidence: event.results[event.results.length - 1][0].confidence });
        }
      });
    };

    this.recognition.onerror = (event: any) => {
      this.ngZone.run(() => {
        this.events$.next({ type: 'error', error: event.error });
      });
    };

    this.recognition.onend = () => {
      this.ngZone.run(() => this.events$.next({ type: 'end' }));
      this.stopVolumeTracking();
    };

    this.startVolumeTracking().then(() => {
      this.recognition.start();
    }).catch((err) => {
      this.ngZone.run(() => {
        this.events$.next({ type: 'error', error: 'permission-denied' });
      });
    });

    return this.events$.asObservable();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.abort();
      this.recognition = null;
    }
    this.stopVolumeTracking();
    this.events$.next({ type: 'end' });
  }

  private async startVolumeTracking(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(this.analyser);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    let lastEmit = 0;

    this.ngZone.runOutsideAngular(() => {
      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        const now = performance.now();
        if (now - lastEmit >= 33) {
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const volume = Math.min(average / 128, 1);
          this.events$.next({ type: 'volume', volume });
          lastEmit = now;
        }

        this.volumeFrameId = requestAnimationFrame(tick);
      };

      this.volumeFrameId = requestAnimationFrame(tick);
    });
  }

  private stopVolumeTracking(): void {
    if (this.volumeFrameId !== null) {
      cancelAnimationFrame(this.volumeFrameId);
      this.volumeFrameId = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }
}
