/**
 * Client-side functions for text-to-speech and speech-to-text using OpenAI API
 */

export interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
}

export interface STTOptions {
  language?: string;
  prompt?: string;
  withTimestamps?: boolean;
}

export interface STTResult {
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

/**
 * Convert text to speech using the TTS API
 * @param text - The text to convert to speech
 * @param options - TTS options
 * @returns Audio blob
 */
export async function clientTextToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice: options.voice || 'alloy',
      model: options.model || 'tts-1',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate speech');
  }

  return await response.blob();
}

/**
 * Convert speech to text using the STT API
 * @param audioFile - The audio file to transcribe
 * @param options - STT options
 * @returns Transcription result
 */
export async function clientSpeechToText(
  audioFile: File | Blob,
  options: STTOptions = {}
): Promise<STTResult> {
  const formData = new FormData();
  
  // Convert Blob to File if necessary
  const file = audioFile instanceof File 
    ? audioFile 
    : new File([audioFile], 'audio.wav', { type: 'audio/wav' });
  
  formData.append('audio', file);
  
  if (options.language) {
    formData.append('language', options.language);
  }
  
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }
  
  if (options.withTimestamps) {
    formData.append('withTimestamps', 'true');
  }

  const response = await fetch('/api/stt', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to transcribe audio');
  }

  return await response.json();
}

/**
 * Play audio blob
 * @param audioBlob - The audio blob to play
 * @returns Promise that resolves when audio finishes playing
 */
export async function playAudio(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to play audio'));
    };
    
    audio.src = url;
    audio.play().catch(reject);
  });
}

/**
 * Download audio blob as a file
 * @param audioBlob - The audio blob to download
 * @param filename - The filename for the download
 */
export function downloadAudio(audioBlob: Blob, filename: string = 'speech.mp3'): void {
  const url = URL.createObjectURL(audioBlob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Record audio from microphone
 * @param durationMs - Duration to record in milliseconds (0 for manual stop)
 * @returns Promise that resolves with recording controls
 */
export async function startRecording(durationMs: number = 0): Promise<{
  stop: () => Promise<Blob>;
  stream: MediaStream;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      const stop = (): Promise<Blob> => {
        return new Promise((stopResolve) => {
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            stream.getTracks().forEach(track => track.stop());
            stopResolve(blob);
          };
          mediaRecorder.stop();
        });
      };

      // Auto-stop after duration if specified
      if (durationMs > 0) {
        setTimeout(() => {
          stop();
        }, durationMs);
      }

      resolve({ stop, stream });
    };

    mediaRecorder.onerror = reject;
    mediaRecorder.start();
  });
}

/**
 * Quick record function that records for a specified duration
 * @param durationMs - Duration to record in milliseconds
 * @returns Promise that resolves with the recorded audio blob
 */
export async function quickRecord(durationMs: number = 5000): Promise<Blob> {
  const { stop } = await startRecording(durationMs);
  
  // Wait for the specified duration
  await new Promise(resolve => setTimeout(resolve, durationMs));
  
  return await stop();
} 