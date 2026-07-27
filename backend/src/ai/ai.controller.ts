import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('summarize')
  async summarize(@Body() body: { content: string }) {
    if (!body.content) throw new BadRequestException('content is required');
    return this.aiService.summarize(body.content);
  }

  @Post('tags')
  async tags(@Body() body: { content: string }) {
    if (!body.content) throw new BadRequestException('content is required');
    return this.aiService.suggestTags(body.content);
  }

  @Post('ask')
  async ask(@Body() body: { question: string }, @Request() req: any) {
    if (!body.question) throw new BadRequestException('question is required');
    return this.aiService.ask(req.user.userId, body.question);
  }
}
