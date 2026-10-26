const missing = new Set<string>();
let currentAudio: HTMLAudioElement | null = null;

/**
 * Prefer a pre-generated MP3; fall back to the browser's English TTS.
 * A missing file is remembered so we do not retry it on every card.
 */
export async function speak(audioId: string, text: string): Promise<void> {
  if (!missing.has(audioId)) {
    try {
      currentAudio?.pause();
      const audio = new Audio(`${import.meta.env.BASE_URL}audio/${audioId}.mp3`);
      currentAudio = audio;
      await audio.play();
      return;
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotAllowedError') {
        missing.add(audioId);
      }
    }
  }
  speakBrowser(text);
}

function speakBrowser(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  utterance.pitch = 1;

  const voices = synth.getVoices();
  const preferred =
    voices.find((voice) => /en-US/i.test(voice.lang) && /google|samantha|microsoft|natural/i.test(voice.name)) ??
    voices.find((voice) => /^en/i.test(voice.lang));
  if (preferred) utterance.voice = preferred;

  synth.speak(utterance);
}

// Some browsers populate voices asynchronously.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}
