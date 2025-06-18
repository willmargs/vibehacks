import { NextRequest, NextResponse } from 'next/server';
import { speechToText, speechToTextWithTimestamps } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string | null;
    const prompt = formData.get('prompt') as string | null;
    const withTimestamps = formData.get('withTimestamps') === 'true';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    let result;
    if (withTimestamps) {
      result = await speechToTextWithTimestamps(
        audioFile,
        language || undefined,
        prompt || undefined
      );
    } else {
      const text = await speechToText(
        audioFile,
        language || undefined,
        prompt || undefined
      );
      result = { text };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('STT API Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 