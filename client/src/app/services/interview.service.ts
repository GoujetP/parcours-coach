import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ConfigService } from '../shared/services/config.service';

export interface InterviewContext {
  firstName: string;
  school: string;
  targetCourse: string;
  style: string;
  interviewType?: string;
}

export interface JuryChunk {
  text: string;
  audioBase64: string;
}

export interface StudentTurn {
  audioBase64: string;
  mimeType: string;
  context: InterviewContext;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private config = inject(ConfigService);
  private socket?: Socket;

  readonly transcript$ = new Subject<string>();
  readonly chunk$ = new Subject<JuryChunk>();
  readonly done$ = new Subject<void>();
  readonly error$ = new Subject<string>();
  readonly connected$ = new Subject<boolean>();

  /** Doit être appelé uniquement côté navigateur (SSR-safe). */
  connect(): void {
    if (this.socket) {
      return;
    }
    // apiUrl = http://host/api/v1 → on retire le suffixe pour atteindre le namespace WS "/interview"
    const base = this.config.apiUrl.replace(/\/api\/v1\/?$/, '');
    this.socket = io(`${base}/interview`, { transports: ['websocket'] });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));
    this.socket.on('connect_error', (e: Error) =>
      this.error$.next('Connexion au serveur impossible : ' + e.message),
    );
    this.socket.on('jury_transcript', (e: { studentTranscript: string }) =>
      this.transcript$.next(e.studentTranscript),
    );
    this.socket.on('jury_chunk', (e: JuryChunk) => this.chunk$.next(e));
    this.socket.on('jury_done', () => this.done$.next());
    this.socket.on('interview_error', (e: { message: string }) => this.error$.next(e.message));
  }

  startInterview(context: InterviewContext): void {
    this.socket?.emit('start_interview', context);
  }

  sendStudentTurn(turn: StudentTurn): void {
    this.socket?.emit('student_speaks', turn);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
