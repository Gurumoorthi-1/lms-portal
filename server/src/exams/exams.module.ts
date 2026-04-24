import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Exam, ExamSchema } from './exam.schema';
import { User, UserSchema } from '../auth/user.schema';
import { ExamsGateway } from './exams.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: User.name, schema: UserSchema },
    ])
  ],
  controllers: [ExamsController],
  providers: [ExamsService, ExamsGateway],
  exports: [ExamsService],
})
export class ExamsModule {}
