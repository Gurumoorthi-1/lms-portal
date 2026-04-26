import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = ['application/pdf', 'text/plain'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and text files are allowed');
    }

    try {
      const analysis = await this.resumeService.parseAndAnalyze(file.buffer, file.mimetype);
      return {
        success: true,
        analysis,
        message: 'Resume analyzed successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Error analyzing resume');
    }
  }
}
