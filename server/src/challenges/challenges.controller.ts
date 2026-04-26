import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  getAllChallenges() {
    return this.challengesService.findAll();
  }

  @Get(':id')
  getChallengeById(@Param('id', ParseIntPipe) id: number) {
    return this.challengesService.findOne(id);
  }

  @Post('generate-ai')
  async generateAiProblems(@Body() body: { context: any, language: string }) {
    const language = body.language || 'javascript';
    const ctx = body.context || { skills: 'JavaScript, Data Structures', technologies: 'Node.js', experience: '1 year', projects: 'Web app', resumeText: '' };
    return this.challengesService.generateAiProblems(ctx, language);
  }

  @Post('evaluate-ai')
  async evaluateAiSubmission(@Body() body: { problem: any, language: string, code: string }) {
    return this.challengesService.evaluateAiSubmission(body.problem, body.language, body.code);
  }
}
