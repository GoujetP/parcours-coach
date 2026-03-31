import { AbstractUseCase } from "src/utils/use-case.absract";
import { StudentProfile } from "../../model/student-profile.model";
import { ResponseModel } from "../../model/response.model";

export type AiGeneratorApi = AbstractUseCase<StudentProfile, ResponseModel>;