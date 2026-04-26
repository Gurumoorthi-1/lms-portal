import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InterviewService } from './interview.service';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('generate')
  async startInterview(@Body() body: { context?: any, skills?: string[], experience?: string[] }) {
    const skills = body.skills || body.context?.skills?.split(', ') || [];
    const experience = body.experience || body.context?.experience?.split('; ') || [];
    
    if (skills.length === 0 && !body.context?.resumeText) {
      throw new BadRequestException('Skills or resume context are required');
    }
    const questions = await this.interviewService.generateQuestions(skills, experience);
    return { success: true, questions };
  }

  @Post('evaluate')
  async respondToQuestion(@Body() body: { question: string, answer: string, evaluationCriteria?: string }) {
    if (!body.question || !body.answer) {
      throw new BadRequestException('Question and answer are required');
    }
    return this.interviewService.analyzeResponse(body.question, body.answer);
  }
}
