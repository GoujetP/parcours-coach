export interface ResponseModel {
  content: string;
  responseId: string;
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}