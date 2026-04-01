import { Controller, Post, Body, Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectionTokenApi } from '../../helper/injection-token.enum';
import { ResponseDto } from '../adapter/dto/response.dto';
import type { StudentProfileDto } from '../adapter/dto/student-profile.dto';

@Controller('api/v1/letter')
export class LetterController {
    
    @Inject(InjectionTokenApi.AiGeneratorApi) aiGenerationApi;

    @Post('/generate')
    @Throttle({ short: { limit: 5, ttl: 300000 } })
    async generate(@Body() requestBody: StudentProfileDto): Promise<ResponseDto> {
       return this.aiGenerationApi.execute(requestBody);
    }
}