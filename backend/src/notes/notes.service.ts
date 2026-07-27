import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(
    userId: string,
    data: { title?: string; content?: string; tags?: string[] },
  ) {
    return this.prisma.note.create({
      data: {
        title: data.title || 'Untitled',
        content: data.content || '',
        tags: data.tags || [],
        userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      tags?: string[];
      summary?: string;
    },
  ) {
    const existing = await this.prisma.note.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Note not found');

    return this.prisma.note.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.summary !== undefined && { summary: data.summary }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const deleted = await this.prisma.note.deleteMany({
      where: { id, userId },
    });
    if (deleted.count === 0) throw new NotFoundException('Note not found');
  }

  async getStats(userId: string) {
    const allNotes = await this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const totalNotes = allNotes.length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const notesThisWeek = allNotes.filter(
      (n) => new Date(n.createdAt) >= oneWeekAgo,
    ).length;

    const tagCount: Record<string, number> = {};
    for (const note of allNotes) {
      for (const tag of note.tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    const recentNotes = allNotes.slice(0, 10).map((n) => ({
      id: n.id,
      title: n.title,
      updatedAt: n.updatedAt,
    }));

    return { totalNotes, notesThisWeek, topTags, recentNotes };
  }
}
