import {
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  InterviewContext,
  InterviewService,
  JuryChunk,
} from '../../services/interview.service';

type Phase = 'config' | 'live';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.scss'],
})
export class InterviewComponent {
  private fb = inject(FormBuilder);
  private interview = inject(InterviewService);
  private destroyRef = inject(DestroyRef);

  phase = signal<Phase>('config');
  amplitude = signal(0); // 0..1 — pilote la taille de l'orbe
  caption = signal(''); // texte du jury qui s'écrit au fur et à mesure
  studentCaption = signal(''); // dernière phrase transcrite de l'étudiant
  isJuryThinking = signal(false);
  isRecording = signal(false);
  isJurySpeaking = signal(false);
  error = signal<string | null>(null);

  status = computed(() => {
    if (this.error()) return '';
    if (this.isRecording()) return 'Je vous écoute…';
    if (this.isJurySpeaking()) return 'Le jury parle…';
    if (this.isJuryThinking()) return 'Le jury réfléchit…';
    return 'À vous de parler';
  });

  configForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    school: ['', Validators.required],
    targetCourse: ['', Validators.required],
    style: ['bienveillant mais exigeant', Validators.required],
    interviewType: ['entretien de motivation'],
  });

  private history: Array<{ role: 'user' | 'model'; text: string }> = [];
  private mediaRecorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private currentAudio?: HTMLAudioElement;
  private audioCtx?: AudioContext;
  private rafId?: number;
  private typeTimer?: ReturnType<typeof setInterval>;
  private isBrowser = false;

  // File d'attente de lecture audio (streaming phrase par phrase)
  private queue: JuryChunk[] = [];
  private playing = false;
  private spokenText = ''; // phrases déjà jouées du tour courant

  constructor() {
    afterNextRender(() => {
      this.isBrowser = true;
      this.interview.connect();

      this.interview.transcript$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((t) => {
          this.isJuryThinking.set(false);
          this.studentCaption.set(t);
          this.history.push({ role: 'user', text: t });
        });

      this.interview.chunk$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((chunk) => this.enqueueChunk(chunk));

      this.interview.done$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const reply = this.spokenText.trim();
          if (reply) this.history.push({ role: 'model', text: reply });
        });

      this.interview.error$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((msg) => {
          this.error.set(msg);
          this.isJuryThinking.set(false);
        });
    });

    this.destroyRef.onDestroy(() => {
      this.stopRecording();
      this.stopPlayback();
      this.stopMeter();
      this.clearTypewriter();
      this.audioCtx?.close();
      this.interview.disconnect();
    });
  }

  start(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.studentCaption.set('');
    this.resetTurn();
    this.history = [];
    this.phase.set('live');
    this.isJuryThinking.set(true);
    this.ensureAudioCtx()?.resume();
    this.interview.startInterview(this.configForm.value as InterviewContext);
  }

  // --- Push-to-talk ---
  async startRecording(): Promise<void> {
    if (!this.isBrowser || this.isJuryThinking() || this.isRecording()) {
      return;
    }
    try {
      this.stopPlayback(); // on coupe le jury si l'étudiant reprend la parole
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
      this.mediaRecorder.onstop = () => this.handleRecordingStop(stream);
      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.error.set(null);
      this.startMicMeter(stream);
    } catch {
      this.error.set("Micro inaccessible. Autorisez l'accès au microphone.");
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
    this.stopMeter();
  }

  private async handleRecordingStop(stream: MediaStream): Promise<void> {
    stream.getTracks().forEach((t) => t.stop());
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const blob = new Blob(this.chunks, { type: mimeType });
    if (blob.size === 0) {
      return;
    }
    const audioBase64 = await this.blobToBase64(blob);
    this.resetTurn();
    this.isJuryThinking.set(true);
    this.interview.sendStudentTurn({
      audioBase64,
      mimeType,
      context: this.configForm.value as InterviewContext,
      history: [...this.history],
    });
  }

  restart(): void {
    this.stopPlayback();
    this.stopMeter();
    this.clearTypewriter();
    this.phase.set('config');
    this.studentCaption.set('');
    this.resetTurn();
    this.history = [];
    this.isJuryThinking.set(false);
  }

  // --- File d'attente audio ---
  private enqueueChunk(chunk: JuryChunk): void {
    this.isJuryThinking.set(false);
    this.queue.push(chunk);
    if (!this.playing) {
      this.playNext();
    }
  }

  private playNext(): void {
    const chunk = this.queue.shift();
    if (!chunk) {
      this.playing = false;
      this.isJurySpeaking.set(false);
      this.stopMeter();
      return;
    }
    this.playing = true;
    this.isJurySpeaking.set(true);

    const ctx = this.ensureAudioCtx();
    const audio = new Audio('data:audio/wav;base64,' + chunk.audioBase64);
    this.currentAudio = audio;

    if (ctx) {
      ctx.resume();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      this.startMeter(analyser);
    }

    audio.onloadedmetadata = () => {
      const durationMs = isFinite(audio.duration) ? audio.duration * 1000 : chunk.text.length * 55;
      this.typewriterAppend(chunk.text, durationMs);
    };
    audio.onended = () => this.playNext();
    audio.onerror = () => {
      this.commitText(chunk.text);
      this.playNext();
    };
    audio.play().catch(() => {
      this.commitText(chunk.text);
      this.playNext();
    });
  }

  private stopPlayback(): void {
    this.queue = [];
    this.playing = false;
    this.currentAudio?.pause();
    this.currentAudio = undefined;
    this.isJurySpeaking.set(false);
    this.clearTypewriter();
    this.stopMeter();
  }

  private resetTurn(): void {
    this.spokenText = '';
    this.caption.set('');
  }

  // --- Visualisation (Web Audio) ---
  private ensureAudioCtx(): AudioContext | undefined {
    if (!this.isBrowser) return undefined;
    if (!this.audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();
    }
    return this.audioCtx;
  }

  private startMicMeter(stream: MediaStream): void {
    const ctx = this.ensureAudioCtx();
    if (!ctx) return;
    ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    this.startMeter(analyser);
  }

  private startMeter(analyser: AnalyserNode): void {
    this.stopMeter();
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const x = (data[i] - 128) / 128;
        sum += x * x;
      }
      const rms = Math.sqrt(sum / data.length);
      this.amplitude.set(Math.min(1, rms * 3.5));
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopMeter(): void {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.amplitude.set(0);
  }

  // --- Effet machine à écrire (accumule les phrases du tour) ---
  private typewriterAppend(sentence: string, durationMs: number): void {
    this.clearTypewriter();
    const base = this.spokenText;
    const total = sentence.length;
    if (total === 0) return;
    const step = Math.max(15, durationMs / total);
    let i = 0;
    this.caption.set(base);
    this.typeTimer = setInterval(() => {
      i++;
      this.caption.set(base + sentence.slice(0, i));
      if (i >= total) {
        this.spokenText = base + sentence + ' ';
        this.clearTypewriter();
      }
    }, step);
  }

  private commitText(sentence: string): void {
    this.spokenText += sentence + ' ';
    this.caption.set(this.spokenText);
  }

  private clearTypewriter(): void {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = undefined;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
