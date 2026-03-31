import { Module } from '@nestjs/common';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [StudentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
