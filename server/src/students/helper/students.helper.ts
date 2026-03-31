import { PostLetterUseCase } from "../app/use-cases/post-letter.use-case"
import { StudentsAdapter } from "../infra/adapter/students.adapter"
import { LetterController } from "../infra/controller/students.controller"
import { InjectionTokenApi, InjectionTokenSpi } from "./injection-token.enum"




export function getControllers() {
    return [LetterController]
}

export function getProviders() {
    return [
        {
            provider: InjectionTokenApi.AiGeneratorApi,
            useClass: PostLetterUseCase, 
        },
        {
            provider: InjectionTokenSpi.AiGeneratorSpi,
            useClass: StudentsAdapter,
        }
    ]
}


