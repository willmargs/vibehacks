'use client';

import { useState } from 'react';
import {
  clientTextToSpeech,
  clientSpeechToText,
  playAudio,
  downloadAudio,
  startRecording,
  quickRecord,
  type TTSOptions,
  type STTOptions,
  type STTResult,
} from '@/app/lib/speech-client';

export default function SpeechDemo() {
  const [text, setText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<STTResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voice, setVoice] = useState<TTSOptions['voice']>('alloy');
  const [language, setLanguage] = useState('');

  const handleTextToSpeech = async () => {
    if (!text.trim()) return;

    setTtsLoading(true);
    try {
      const audioBlob = await clientTextToSpeech(text, { voice });
      setAudioBlob(audioBlob);
      await playAudio(audioBlob);
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Failed to generate speech. Please check your OpenAI API key.');
    } finally {
      setTtsLoading(false);
    }
  };

  const handleQuickRecord = async () => {
    setIsRecording(true);
    try {
      const audioBlob = await quickRecord(5000); // 5 seconds
      await handleSpeechToText(audioBlob);
    } catch (error) {
      console.error('Recording Error:', error);
      alert('Failed to record audio. Please check microphone permissions.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleManualRecord = async () => {
    if (isRecording) return;

    setIsRecording(true);
    try {
      const { stop } = await startRecording();
      
      // Store stop function for manual control
      (window as any).stopRecording = async () => {
        const audioBlob = await stop();
        setIsRecording(false);
        await handleSpeechToText(audioBlob);
        delete (window as any).stopRecording;
      };
    } catch (error) {
      console.error('Recording Error:', error);
      alert('Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopManualRecord = () => {
    if ((window as any).stopRecording) {
      (window as any).stopRecording();
    }
  };

  const handleSpeechToText = async (audioFile: Blob) => {
    setSttLoading(true);
    try {
      const options: STTOptions = {
        withTimestamps: true,
      };
      
      if (language) {
        options.language = language;
      }

      const result = await clientSpeechToText(audioFile, options);
      setTranscription(result);
    } catch (error) {
      console.error('STT Error:', error);
      alert('Failed to transcribe audio. Please check your OpenAI API key.');
    } finally {
      setSttLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleSpeechToText(file);
    }
  };

  const downloadGeneratedAudio = () => {
    if (audioBlob) {
      downloadAudio(audioBlob, 'generated-speech.mp3');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">OpenAI Speech Demo</h1>
      
      {/* Text to Speech Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Text to Speech</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Voice:</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as TTSOptions['voice'])}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Text:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="w-full p-3 border border-gray-300 rounded-md h-32 resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleTextToSpeech}
              disabled={ttsLoading || !text.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {ttsLoading ? 'Generating...' : 'Generate & Play Speech'}
            </button>
            
            {audioBlob && (
              <button
                onClick={downloadGeneratedAudio}
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
              >
                Download Audio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Speech to Text Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Speech to Text</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Language (optional):</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g., en, es, fr, de..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleQuickRecord}
              disabled={sttLoading || isRecording}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRecording ? 'Recording (5s)...' : 'Quick Record (5s)'}
            </button>
            
            <button
              onClick={isRecording ? stopManualRecord : handleManualRecord}
              disabled={sttLoading}
              className={`px-6 py-2 rounded-md text-white ${
                isRecording 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isRecording ? 'Stop Recording' : 'Manual Record'}
            </button>
            
            <label className="bg-purple-500 text-white px-6 py-2 rounded-md hover:bg-purple-600 cursor-pointer">
              Upload Audio File
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={sttLoading}
              />
            </label>
          </div>
          
          {sttLoading && (
            <div className="text-blue-600 font-medium">Transcribing audio...</div>
          )}
        </div>
      </div>

      {/* Transcription Results */}
      {transcription && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Transcription Result</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Text:</label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {transcription.text}
              </div>
            </div>
            
            {transcription.words && transcription.words.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Word Timestamps:</label>
                <div className="p-3 bg-gray-50 rounded-md border max-h-40 overflow-y-auto">
                  <div className="space-y-1 text-sm">
                    {transcription.words.map((word, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">{word.word}</span>
                        <span className="text-gray-600">
                          {word.start.toFixed(2)}s - {word.end.toFixed(2)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Setup Instructions</h3>
        <div className="text-yellow-700 space-y-2">
          <p>1. Add your OpenAI API key to your environment:</p>
          <code className="bg-yellow-100 px-2 py-1 rounded text-sm">
            OPENAI_API_KEY=your_api_key_here
          </code>
          <p>2. Make sure your environment file (.env.local) is in the root directory</p>
          <p>3. Restart your development server after adding the API key</p>
        </div>
      </div>
    </div>
  );
} 