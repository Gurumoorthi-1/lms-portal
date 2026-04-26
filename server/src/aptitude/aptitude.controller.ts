import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AptitudeService } from './aptitude.service';

@Controller('aptitude')
export class AptitudeController {
  constructor(private readonly aptitudeService: AptitudeService) {}

  @Post('generate')
  async generateQuestions(@Body() body: { skills: string[], totalQuestions?: number }) {
    if (!body.skills || body.skills.length === 0) {
      throw new BadRequestException('Skills are required to generate the aptitude test.');
    }
    const skillsString = body.skills.slice(0, 5).join(', ');
    return this.aptitudeService.generateTest(skillsString, body.totalQuestions || 10);
  }

  @Post('submit')
  async submitTest(@Body() body: { answers: any[], questions: any[] }) {
    if (!body.answers || !body.questions) {
      throw new BadRequestException('Answers and original questions are required for evaluation.');
    }
    return this.aptitudeService.evaluateTest(body.answers, body.questions);
  }
}
