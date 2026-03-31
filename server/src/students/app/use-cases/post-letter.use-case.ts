import { Inject } from "@nestjs/common";
import { InjectionTokenSpi } from "../../helper/injection-token.enum";
import { StudentProfile } from "../model/student-profile.model";
import { AiGeneratorApi } from "../port/api/ai-generator.api";
import { ResponseModel } from "../model/response.model";

export class PostLetterUseCase implements AiGeneratorApi {

    @Inject(InjectionTokenSpi.AiGeneratorSpi) aiGeneratorSpi;

    execute(input: StudentProfile): Promise<ResponseModel> {
        return this.aiGeneratorSpi.generate(input);
    }
    
}