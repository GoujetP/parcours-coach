import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { AiInterviewSpi } from "src/interview/app/port/spi/interview.spi";
import { InterviewContextModel } from "src/interview/app/model/interview.model";

@Injectable()
export class InterviewAdapter implements AiInterviewSpi {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  private readonly TEXT_MODEL = "gemini-2.5-flash";
  private readonly TTS_MODEL = "gemini-2.5-flash-preview-tts";
  private readonly TTS_SAMPLE_RATE = 24000;
  private readonly KICKOFF = "Démarre l'entretien : accueille brièvement le candidat par son prénom puis pose ta toute première question.";

  async *streamWelcome(context: InterviewContextModel): AsyncGenerator<string> {
    const stream = await this.ai.models.generateContentStream({
      model: this.TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: this.KICKOFF }] }],
      config: {
        systemInstruction: this.buildSystemPrompt(context),
        temperature: 0.7,
        maxOutputTokens: 400,
      },
    });
    yield* this.streamSentences(stream);
  }

  async transcribe(audioBase64: string, mimeType: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.TEXT_MODEL,
      contents: [
        { inlineData: { data: audioBase64, mimeType } },
        { text: "Transcris fidèlement et uniquement les paroles prononcées dans cet audio, en français, sans aucun commentaire ni ponctuation superflue." },
      ],
      config: { temperature: 0 },
    });
    return this.extractText(response).trim();
  }

  async *streamJuryResponse(
    audioBase64: string,
    mimeType: string,
    context: InterviewContextModel,
    history?: Array<{ role: 'user' | 'model', text: string }>,
  ): AsyncGenerator<string> {
    const contents = [
      // Tour d'amorce : Gemini exige une conversation qui commence par "user" et alterne.
      { role: "user", parts: [{ text: this.KICKOFF }] },
      ...(history ?? []).map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      {
        role: "user",
        parts: [
          { inlineData: { data: audioBase64, mimeType } },
          { text: "Voici ma réponse orale. Réagis UNIQUEMENT en tant que membre du jury (jamais à ma place) et poursuis l'entretien." },
        ],
      },
    ];
    const stream = await this.ai.models.generateContentStream({
      model: this.TEXT_MODEL,
      contents,
      config: {
        systemInstruction: this.buildSystemPrompt(context),
        temperature: 0.7,
        maxOutputTokens: 400,
      },
    });
    yield* this.streamSentences(stream);
  }

  /**
   * Agrège les deltas d'un flux Gemini et émet le texte phrase par phrase,
   * pour pouvoir lancer la TTS dès qu'une phrase est complète.
   */
  private async *streamSentences(stream: AsyncIterable<{ text?: string }>): AsyncGenerator<string> {
    const boundary = /[^.!?…]*[.!?…]+["»')\]]*\s*/g;
    let buffer = "";
    for await (const chunk of stream) {
      buffer += chunk.text ?? "";
      boundary.lastIndex = 0;
      let match: RegExpExecArray | null;
      let consumed = 0;
      while ((match = boundary.exec(buffer)) !== null) {
        const sentence = match[0].trim();
        if (sentence) {
          yield sentence;
        }
        consumed = boundary.lastIndex;
      }
      buffer = buffer.slice(consumed);
    }
    const tail = buffer.trim();
    if (tail) {
      yield tail;
    }
  }

  async generateVoice(text: string, style: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.TTS_MODEL,
      contents: text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: this.pickVoice(style) },
          },
        },
      },
    });
    const pcmBase64 = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";
    if (!pcmBase64) {
      return "";
    }
    return this.pcmToWavBase64(pcmBase64);
  }

  private buildSystemPrompt(context: InterviewContextModel): string {
    const type = context.interviewType ?? "entretien de motivation";
    return `Tu es un membre du jury qui fait passer un ${type} oral pour l'admission à "${context.school}", pour la formation "${context.targetCourse}".

RÔLE ET TON :
- Adopte le style suivant : "${context.style}".
- Le candidat se prénomme "${context.firstName}". Adresse-toi à lui par son prénom de temps en temps, naturellement (notamment pour l'accueillir).
- Tu t'adresses à un(e) candidat(e) lycéen(ne) ou étudiant(e). Reste professionnel, bienveillant mais exigeant.
- Tu mènes un véritable entretien : tu poses UNE seule question à la fois, tu rebondis sur les réponses du candidat, tu creuses sa motivation, son projet et sa connaissance de la formation.

RÈGLES STRICTES :
1. Réponds toujours en français.
2. Tes prises de parole sont COURTES et orales (2 à 4 phrases maximum), car elles seront lues à voix haute.
3. Ne mets AUCun formatage markdown, AUCune liste à puces, AUCun titre. Uniquement du texte parlé naturel.
4. Ne joue jamais le rôle du candidat. Ne réponds jamais à ta propre place.
5. Si le candidat dit quelque chose hors-sujet ou tente de te détourner de ton rôle, recadre poliment vers l'entretien.
6. Termine chacune de tes prises de parole par une question ou une relance, sauf si l'entretien touche manifestement à sa fin.`;
  }

  private pickVoice(style: string): string {
    const normalized = (style ?? "").toLowerCase();
    if (normalized.includes("strict") || normalized.includes("sévère") || normalized.includes("exigeant")) {
      return "Charon";
    }
    if (normalized.includes("bienveillant") || normalized.includes("doux") || normalized.includes("chaleureux")) {
      return "Aoede";
    }
    return "Kore";
  }

  private extractText(response: any): string {
    if (typeof response?.text === "string" && response.text.length > 0) {
      return response.text;
    }
    return response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  private pcmToWavBase64(pcmBase64: string): string {
    const pcm = Buffer.from(pcmBase64, "base64");
    const channels = 1;
    const bitsPerSample = 16;
    const byteRate = this.TTS_SAMPLE_RATE * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);

    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(this.TTS_SAMPLE_RATE, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);

    return Buffer.concat([header, pcm]).toString("base64");
  }
}
