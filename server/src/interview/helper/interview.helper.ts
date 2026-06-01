
import { InitInterviewUseCase } from "../app/use-case/init-interview.use-case"
import { ProcessInterviewUseCase } from "../app/use-case/process-interview.use-case"
import { InterviewAdapter } from "../infra/adapter/interview.adapter"
import { InterviewGateway } from "../infra/gateway/interview.gateway"
import { InjectionTokenApi, InjectionTokenSpi } from "./injection-token.enum"

export function getControllers() {
    return []
}

export function getProviders() {
    return [
        {
            provider: InjectionTokenApi.InitInterviewApi,
            useClass: InitInterviewUseCase, 
        },
        {
            provider: InjectionTokenApi.ProcessInterviewApi,
            useClass: ProcessInterviewUseCase, 
        },
        {
            provider: InjectionTokenSpi.AiInterviewSpi,
            useClass: InterviewAdapter,
        }
    ]
}