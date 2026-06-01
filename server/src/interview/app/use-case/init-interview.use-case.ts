import { Inject, Injectable } from "@nestjs/common";
import { InjectionTokenSpi } from "src/interview/helper/injection-token.enum";
import { InterviewContextModel } from "../model/interview.model";
import { InterviewStreamEvent } from "../model/interview-stream.model";
import { InitInterviewApi } from "../port/api/init-interview.api";
import type { AiInterviewSpi } from "../port/spi/interview.spi";

@Injectable()
export class InitInterviewUseCase implements InitInterviewApi {
  @Inject(InjectionTokenSpi.AiInterviewSpi)
  private readonly aiInterviewSpi: AiInterviewSpi;

  async *execute(context: InterviewContextModel): AsyncGenerator<InterviewStreamEvent> {
    for await (const sentence of this.aiInterviewSpi.streamWelcome(context)) {
      const audioBase64 = await this.aiInterviewSpi.generateVoice(sentence, context.style);
      yield { type: 'chunk', text: sentence, audioBase64 };
    }
    yield { type: 'done' };
  }
}
