import { Module } from '@nestjs/common';
import { getControllers, getProviders } from './helper/students.helper';

const providers = getProviders().map(p => ({ provide: p.provider, useClass: p.useClass }));

@Module({
  controllers: [...getControllers()],
  providers,
  exports: providers,
})
export class StudentsModule {}