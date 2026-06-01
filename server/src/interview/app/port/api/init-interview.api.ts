import { InterviewContextModel } from "../../model/interview.model";
import { InterviewStreamEvent } from "../../model/interview-stream.model";

export interface InitInterviewApi {
  execute(context: InterviewContextModel): AsyncGenerator<InterviewStreamEvent>;
}
