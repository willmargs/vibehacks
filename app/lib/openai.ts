import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

/**
 * Convert text to speech using OpenAI's TTS API
 * @param text - The text to convert to speech
 * @param voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @param model - The TTS model to use (tts-1 or tts-1-hd)
 * @returns Audio buffer
 */
export async function textToSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  model: 'tts-1' | 'tts-1-hd' = 'tts-1'
): Promise<ArrayBuffer> {
  try {
    const response = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
    });

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    throw new Error(`Failed to convert text to speech: ${error}`);
  }
}

/**
 * Convert speech to text using OpenAI's Whisper API
 * @param audioFile - The audio file to transcribe (File or Blob)
 * @param language - Optional language code (e.g., 'en', 'es', 'fr')
 * @param prompt - Optional prompt to guide the transcription
 * @returns Transcribed text
 */
export async function speechToText(
  audioFile: File | Blob,
  language?: string,
  prompt?: string
): Promise<string> {
  try {
    // Convert Blob to File if necessary
    const file = audioFile instanceof File 
      ? audioFile 
      : new File([audioFile], 'audio.wav', { type: 'audio/wav' });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language,
      prompt: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error in speechToText:', error);
    throw new Error(`Failed to convert speech to text: ${error}`);
  }
}

/**
 * Convert speech to text with timestamps using OpenAI's Whisper API
 * @param audioFile - The audio file to transcribe (File or Blob)
 * @param language - Optional language code (e.g., 'en', 'es', 'fr')
 * @param prompt - Optional prompt to guide the transcription
 * @returns Transcribed text with word-level timestamps
 */
export async function speechToTextWithTimestamps(
  audioFile: File | Blob,
  language?: string,
  prompt?: string
): Promise<{
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}> {
  try {
    // Convert Blob to File if necessary
    const file = audioFile instanceof File 
      ? audioFile 
      : new File([audioFile], 'audio.wav', { type: 'audio/wav' });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language,
      prompt: prompt,
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    return {
      text: response.text,
      words: response.words,
    };
  } catch (error) {
    console.error('Error in speechToTextWithTimestamps:', error);
    throw new Error(`Failed to convert speech to text with timestamps: ${error}`);
  }
}

/**
 * Helper function to play audio from ArrayBuffer
 * @param audioBuffer - The audio buffer to play
 * @returns Promise that resolves when audio finishes playing
 */
export async function playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audioContext.decodeAudioData(audioBuffer)
        .then((decodedData) => {
          const source = audioContext.createBufferSource();
          source.buffer = decodedData;
          source.connect(audioContext.destination);
          
          source.onended = () => resolve();
          source.start(0);
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper function to download audio as a file
 * @param audioBuffer - The audio buffer to download
 * @param filename - The filename for the download
 */
export function downloadAudioBuffer(audioBuffer: ArrayBuffer, filename: string = 'speech.mp3'): void {
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Helper function to record audio from microphone
 * @param durationMs - Duration to record in milliseconds
 * @returns Promise that resolves with the recorded audio blob
 */
export async function recordAudio(durationMs: number = 10000): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        resolve(blob);
      };

      mediaRecorder.start();
      
      // Stop recording after specified duration
      setTimeout(() => {
        mediaRecorder.stop();
      }, durationMs);

    } catch (error) {
      reject(error);
    }
  });
} 