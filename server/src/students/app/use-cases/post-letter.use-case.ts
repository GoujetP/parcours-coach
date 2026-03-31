import { Inject } from "@nestjs/common";
import { InjectionTokenSpi } from "src/students/helper/injection-token.enum";
import { StudentProfile } from "../model/student-profile.model";
import { AiGeneratorApi } from "../port/api/ai-generator.api";

export class PostLetterUseCase implements AiGeneratorApi {

    @Inject(InjectionTokenSpi.AiGeneratorSpi) aiGeneratorSpi;

    execute(input: StudentProfile): Promise<string> {
        return this.aiGeneratorSpi.generate(input);
    }
    
}