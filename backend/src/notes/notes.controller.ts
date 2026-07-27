import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotesService } from './notes.service';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.notesService.findAll(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.notesService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.notesService.findOne(id, req.user.userId);
  }

  @Post()
  create(
    @Body() body: { title?: string; content?: string; tags?: string[] },
    @Request() req: any,
  ) {
    return this.notesService.create(req.user.userId, body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      tags?: string[];
      summary?: string;
    },
    @Request() req: any,
  ) {
    return this.notesService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.notesService.remove(id, req.user.userId);
  }
}
