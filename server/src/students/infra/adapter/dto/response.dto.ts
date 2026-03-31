export interface ResponseDto {
  content: string;
  responseId: string;
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}