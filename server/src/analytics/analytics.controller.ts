import { Controller, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('report')
  async generateReport(@Body() body: any) {
    return this.analyticsService.generateReport(body);
  }

  @Post('proctoring')
  async logProctoringEvent(@Body() body: any) {
    return this.analyticsService.logProctoringEvent(body);
  }

  @Post('emotion')
  async saveEmotionReport(@Body() body: any) {
    return this.analyticsService.saveEmotionReport(body);
  }
}
