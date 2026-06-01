import { InterviewContextModel } from "../../model/interview.model";


export interface AiInterviewSpi {
  /**
   * Stream le texte d'accueil du jury, phrase par phrase (première prise de parole + première question).
   */
  streamWelcome(context: InterviewContextModel): AsyncGenerator<string>;

  /**
   * Transcrit l'audio de l'étudiant en texte (Speech-To-Text côté serveur).
   */
  transcribe(audioBase64: string, mimeType: string): Promise<string>;

  /**
   * Stream la réponse du jury, phrase par phrase, directement à partir de l'audio de l'étudiant
   * (multimodal), afin de pouvoir tourner en parallèle de la transcription.
   */
  streamJuryResponse(
    audioBase64: string,
    mimeType: string,
    context: InterviewContextModel,
    history?: Array<{ role: 'user' | 'model', text: string }>,
  ): AsyncGenerator<string>;

  /**
   * Transforme un fragment de texte en voix (WAV encodé en Base64).
   */
  generateVoice(text: string, style: string): Promise<string>;
}
