import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
const pdfParse = require('pdf-parse');

@Injectable()
export class ResumeService {
  constructor(private readonly aiService: AiService) {}

  async parseAndAnalyze(buffer: Buffer, mimetype: string): Promise<any> {
    let text = '';
    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text || text.length < 50) {
      throw new BadRequestException('Could not extract sufficient text from the resume.');
    }

    return this.aiService.analyzeResume(text);
  }
}
