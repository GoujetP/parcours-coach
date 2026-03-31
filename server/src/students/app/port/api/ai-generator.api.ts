import { AbstractUseCase } from "src/utils/use-case.absract";
import { StudentProfile } from "../../model/student-profile.model";

export type AiGeneratorApi = AbstractUseCase<StudentProfile, string>;