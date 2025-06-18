import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { text, voice, model } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const audioBuffer = await textToSpeech(text, voice, model);

    // Convert ArrayBuffer to Buffer for the response
    const buffer = Buffer.from(audioBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 