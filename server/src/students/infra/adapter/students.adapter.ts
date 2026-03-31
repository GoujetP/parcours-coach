import { AiGeneratorSpi } from "src/students/app/port/spi/ai-generator.spi";
import { ResponseDto } from "./dto/response.dto";
import type { StudentProfileDto } from "./dto/student-profile.dto";

export class StudentsAdapter implements AiGeneratorSpi {
    generate(input: StudentProfileDto): Promise<ResponseDto> {
        throw new Error("Method not implemented.");
    }
    
}