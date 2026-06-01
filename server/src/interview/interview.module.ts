import { Module } from '@nestjs/common';
import { getControllers, getProviders } from './helper/interview.helper';
import { InterviewGateway } from './infra/gateway/interview.gateway';

const providers = getProviders().map(p => ({ provide: p.provider, useClass: p.useClass }));

@Module({
  controllers: [...getControllers()],
  providers: [...providers, InterviewGateway],
  exports: providers,
})
export class InterviewModule {}