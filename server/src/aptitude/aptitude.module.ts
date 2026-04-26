import { Module } from '@nestjs/common';
import { AptitudeController } from './aptitude.controller';
import { AptitudeService } from './aptitude.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [AptitudeController],
  providers: [AptitudeService],
  exports: [AptitudeService],
})
export class AptitudeModule {}
