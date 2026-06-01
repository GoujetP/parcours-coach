import { Inject, Injectable } from "@nestjs/common";
import { InjectionTokenSpi } from "src/interview/helper/injection-token.enum";
import { InterviewStreamEvent } from "../model/interview-stream.model";
import { ProcessInterviewApi } from "../port/api/process-interview.api";
import { StudentTurnModel } from "../model/interview-student.model";
import type { AiInterviewSpi } from "../port/spi/interview.spi";

@Injectable()
export class ProcessInterviewUseCase implements ProcessInterviewApi {
  @Inject(InjectionTokenSpi.AiInterviewSpi)
  private readonly aiInterviewSpi: AiInterviewSpi;

  async *execute(input: StudentTurnModel): AsyncGenerator<InterviewStreamEvent> {
    // La transcription (affichage/historique) tourne en parallèle du stream de réponse du jury.
    const transcriptPromise = this.aiInterviewSpi.transcribe(input.audioBase64, input.mimeType);
    let transcriptSent = false;

    for await (const sentence of this.aiInterviewSpi.streamJuryResponse(
      input.audioBase64,
      input.mimeType,
      input.context,
      input.history,
    )) {
      const audioBase64 = await this.aiInterviewSpi.generateVoice(sentence, input.context.style);
      if (!transcriptSent) {
        yield { type: 'transcript', studentTranscript: await transcriptPromise };
        transcriptSent = true;
      }
      yield { type: 'chunk', text: sentence, audioBase64 };
    }

    if (!transcriptSent) {
      yield { type: 'transcript', studentTranscript: await transcriptPromise };
    }
    yield { type: 'done' };
  }
}
