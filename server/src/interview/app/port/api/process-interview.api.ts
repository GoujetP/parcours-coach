import { StudentTurnModel } from "../../model/interview-student.model";
import { InterviewStreamEvent } from "../../model/interview-stream.model";

export interface ProcessInterviewApi {
  execute(input: StudentTurnModel): AsyncGenerator<InterviewStreamEvent>;
}
