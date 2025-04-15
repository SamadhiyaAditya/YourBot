import React, { useEffect, useRef, useState } from 'react';

const VoiceHandler = ({ onVoiceInput, botResponseToSpeak, inputMode }) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);  // New state to track speaking status

  // Handle Voice Recognition (Input)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onVoiceInput(transcript);
      };

      recognitionRef.current = recognition;
    } else {
      alert('Sorry, your browser does not support voice recognition.');
    }
  }, [onVoiceInput]);

  // Handle Speech Synthesis (Output)
  useEffect(() => {
    if (botResponseToSpeak && inputMode === 'voice' && !isSpeaking) {
      setIsSpeaking(true);  // Set speaking status to true before speaking
      const synth = window.speechSynthesis;
      
      // Cancel any ongoing speech before starting new one
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(botResponseToSpeak);
      utterance.lang = 'en-US';

      utterance.onend = () => {
        setIsSpeaking(false);  // Reset speaking status when speech ends
      };

      synth.speak(utterance);
    }
  }, [botResponseToSpeak, inputMode, isSpeaking]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        {isListening ? 'Listening...' : '🎤 Speak'}
      </button>
    </div>
  );
};

export default VoiceHandler;
