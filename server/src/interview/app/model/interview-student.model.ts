import { InterviewContextModel } from "./interview.model";


export interface StudentTurnModel {
  audioBase64: string;
  mimeType: string;
  context: InterviewContextModel;
  history?: Array<{ role: 'user' | 'model', text: string }>;
}
