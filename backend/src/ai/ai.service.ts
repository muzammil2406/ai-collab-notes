import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT = 30000;

@Injectable()
export class AiService {
  private apiKey: string;

  constructor(private prisma: PrismaService) {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  private getKey(): string {
    if (!this.apiKey) {
      throw new BadRequestException('GROQ_API_KEY is not configured on the server');
    }
    return this.apiKey;
  }

  private async chat(systemPrompt: string, userPrompt: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getKey()}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new BadRequestException(`Groq API error: ${err}`);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      if (!choice?.message?.content) {
        throw new BadRequestException('Unexpected response from Groq API');
      }
      return choice.message.content as string;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.name === 'AbortError') {
        throw new BadRequestException('AI request timed out');
      }
      throw new BadRequestException('Failed to reach Groq API');
    } finally {
      clearTimeout(timeout);
    }
  }

  async summarize(content: string) {
    try {
      const summary = await this.chat(
        'You are a helpful assistant that summarizes notes concisely.',
        `Summarize the following note in exactly 3 concise bullet points. Use "• " prefix for each bullet. Do not include any other text, headings, or explanations.\n\n${content}`,
      );
      return { summary };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to generate summary');
    }
  }

  async suggestTags(content: string) {
    try {
      const text = await this.chat(
        'You are a tagging assistant. Return ONLY a JSON array of lowercase strings, nothing else.',
        `Analyze the following note content and suggest 3-5 relevant tags. Return ONLY a JSON array of lowercase tag strings, nothing else. No explanation. Example: ["javascript", "react", "tutorial"]\n\n${content}`,
      );

      const match = text.match(/\[.*\]/s);
      if (match) {
        return { tags: JSON.parse(match[0]) };
      }
      return { tags: [] };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to suggest tags');
    }
  }

  async ask(userId: string, question: string) {
    const notes = await this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, content: true },
    });

    if (notes.length === 0) {
      return {
        answer: 'You have no notes to search through yet.',
        sourceNoteId: null,
        sourceNoteTitle: null,
      };
    }

    try {
      const notesContext = notes
        .map(
          (n, i) =>
            `[Note ${i + 1}: "${n.title}" (id: ${n.id})]\n${n.content.slice(0, 2000)}`,
        )
        .join('\n\n');

      const text = await this.chat(
        'You are a helpful assistant. Answer the user\'s question based ONLY on the provided notes. If the answer cannot be found in the notes, say "I couldn\'t find relevant information in your notes."',
        `Notes:\n${notesContext}\n\nQuestion: ${question}\n\nAfter your answer, on a completely new line write "SOURCE: <note-id>" indicating which note the main answer came from. If no specific note, write "SOURCE: none".`,
      );

      const sourceMatch = text.match(/SOURCE:\s*(.+)/i);
      const sourceId = sourceMatch ? sourceMatch[1].trim() : null;

      let sourceTitle = null;
      if (sourceId && sourceId !== 'none') {
        const note = notes.find((n) => n.id === sourceId);
        sourceTitle = note?.title || null;
      }

      const answer = text.replace(/\n?SOURCE:\s*.+/i, '').trim();

      return {
        answer,
        sourceNoteId: sourceId === 'none' ? null : sourceId,
        sourceNoteTitle: sourceTitle,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to process your question');
    }
  }
}
