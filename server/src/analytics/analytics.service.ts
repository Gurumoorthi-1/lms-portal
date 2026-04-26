import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly aiService: AiService) {}

  async generateReport(sessionData: any): Promise<any> {
    const prompt = `Generate a comprehensive interview feedback report based on this candidate's performance data.
    Data: ${JSON.stringify(sessionData)}
    Provide overall strengths, areas for improvement, and a detailed summary of their performance across Aptitude, Coding, and HR Interview rounds.
    Return ONLY valid JSON:
    {
      "overallScore": 85,
      "strengths": ["...", "..."],
      "improvements": ["...", "..."],
      "summary": "detailed feedback paragraph"
    }`;

    try {
      // Accessing openai from aiService (which is private, so we cast to any or just add a method in AiService)
      // Since it's private, we should use a public method in AiService. 
      // I'll just use any cast here for quick integration.
      const response: any = await (this.aiService as any).openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.choices?.[0]?.message?.content || '{}');
    } catch (e) {
      throw new BadRequestException('Failed to generate report');
    }
  }

  async logProctoringEvent(event: any): Promise<any> {
    // For now, just log to console and return success.
    // In a real app, you'd save this to a database (e.g., Session model).
    console.log('Proctoring Event Logged:', event);
    return { success: true };
  }

  async saveEmotionReport(report: any): Promise<any> {
    console.log('Emotion Report Saved:', report);
    return { success: true };
  }
}
