import React, { useRef, useState, useEffect } from 'react';
import { Mic, Square, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function VoiceMealLogger({ onTranscriptionComplete, isProcessing }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const [waveformBars, setWaveformBars] = useState(Array(20).fill(0));

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + transcriptSegment);
        } else {
          interim += transcriptSegment;
        }
      }

      // Animate waveform
      setWaveformBars(Array(20).fill(0).map(() => Math.random() * 100));

      // Reset silence timeout
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
      }, 1500);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Error recording audio');
      }
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported on this device');
      return;
    }
    recognitionRef.current.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setWaveformBars(Array(20).fill(0));
  };

  const handleSubmitTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('Please record something first');
      return;
    }

    setIsTranscribing(true);
    try {
      await onTranscriptionComplete(transcript);
      setShowDialog(false);
      setTranscript('');
    } catch (error) {
      toast.error('Failed to process meal log');
      console.error('Error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        disabled={isProcessing || isRecording}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Voice Log
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Meal Log</DialogTitle>
            <DialogDescription>
              Speak naturally about what you ate. Tap stop when done.
            </DialogDescription>
          </DialogHeader>

          {!isRecording ? (
            <div className="space-y-4 py-6">
              {transcript && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Transcribed:</p>
                  <p className="text-slate-900 font-medium">{transcript}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleStartRecording}
                  disabled={isTranscribing}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </Button>
              </div>

              {transcript && (
                <Button
                  onClick={handleSubmitTranscript}
                  disabled={isTranscribing}
                  className="w-full gap-2"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Review & Log Meal'
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-8">
              {/* Animated Waveform */}
              <div className="flex items-center justify-center gap-1 h-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                {waveformBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-full transition-all"
                    style={{
                      height: `${20 + height * 0.6}px`,
                      opacity: 0.6 + (height / 100) * 0.4
                    }}
                  />
                ))}
              </div>

              {transcript && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-24 overflow-y-auto">
                  <p className="text-xs text-slate-600 mb-1">Live transcription:</p>
                  <p className="text-sm text-slate-900">{transcript}</p>
                </div>
              )}

              <Button
                onClick={handleStopRecording}
                variant="destructive"
                className="w-full h-12 gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Will auto-stop after 30 seconds of silence
              </p>
            </div>
          )}

          {!isRecording && (
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setTranscript('');
              }}
            >
              Close
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}