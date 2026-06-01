import { InterviewContextDto } from "./interview.dto";


export interface StudentTurnDto {
  audioBase64: string;
  mimeType: string;
  context: InterviewContextDto;
  history?: Array<{ role: 'user' | 'model', text: string }>;
}
