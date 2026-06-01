import { Inject } from '@nestjs/common';
import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { InjectionTokenApi } from '../../helper/injection-token.enum';
import type { InterviewContextDto } from '../dto/interview.dto';
import type { StudentTurnDto } from '../dto/interview-student.dto';
import type { InterviewStreamEvent } from '../../app/model/interview-stream.model';

// On ouvre un canal WebSocket dédié sur le chemin '/interview'
@WebSocketGateway({ cors: true, namespace: 'interview' })
export class InterviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(InjectionTokenApi.InitInterviewApi)
    private readonly initInterviewUseCase,

    @Inject(InjectionTokenApi.ProcessInterviewApi)
    private readonly processTurnUseCase,
  ) {}

  // Optionnel : Juste pour logger quand le front-end Angular se connecte
  handleConnection(client: Socket) {
    console.log(`Étudiant connecté à l'entretien : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Étudiant déconnecté : ${client.id}`);
  }

  /**
   * ÉVÉNEMENT 1 : L'étudiant clique sur "Commencer"
   * Le Front envoie juste le contexte (école, style du jury)
   */
  @SubscribeMessage('start_interview')
  async handleInit(
    @MessageBody() context: InterviewContextDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Le Use Case émet ses phrases au fil de l'eau (texte + audio).
      for await (const event of this.initInterviewUseCase.execute(context)) {
        this.emitEvent(client, event);
      }
    } catch (error) {
      console.error('Erreur Init:', error);
      client.emit('interview_error', { message: 'Le jury est indisponible pour le moment.' });
    }
  }

  /**
   * ÉVÉNEMENT 2 : L'étudiant a fini de parler
   * Le Front envoie ce que l'étudiant a dit + le contexte
   */
  @SubscribeMessage('student_speaks')
  async handleTurn(
    @MessageBody() studentTurn: StudentTurnDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Transcription puis réponse du jury, émises phrase par phrase.
      for await (const event of this.processTurnUseCase.execute(studentTurn)) {
        this.emitEvent(client, event);
      }
    } catch (error) {
      console.error('Erreur Turn:', error);
      client.emit('interview_error', { message: 'Le jury n\'a pas compris, pouvez-vous répéter ?' });
    }
  }

  private emitEvent(client: Socket, event: InterviewStreamEvent) {
    switch (event.type) {
      case 'transcript':
        client.emit('jury_transcript', { studentTranscript: event.studentTranscript });
        break;
      case 'chunk':
        client.emit('jury_chunk', { text: event.text, audioBase64: event.audioBase64 });
        break;
      case 'done':
        client.emit('jury_done', {});
        break;
    }
  }
}