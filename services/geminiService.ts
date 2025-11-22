import { GoogleGenAI } from "@google/genai";
import { WheelSegment } from "../types";

const apiKey = process.env.API_KEY;

// Helper: Decode Base64 to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Convert raw PCM to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateCommentary = async (segment: WheelSegment, playerName: string): Promise<string> => {
  if (!apiKey) {
    return "Ho ho ho! The spirits of Christmas have spoken!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are a witty, slightly snarky, but fun Christmas Elf game show host.
      A player named "${playerName}" just spun the Wheel of Christmas and landed on "${segment.label}".
      The rule for this spot is: "${segment.description}".
      
      Give a very short (max 2 sentences), funny reaction to this result. 
      If they have to steal, encourage mischief. If they are blindfolded, make a joke about it.
      Keep it family friendly but entertaining.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "The elves are speechless!";
  } catch (error) {
    console.error("Error fetching commentary:", error);
    return "The North Pole connection is snowy today! Just follow the rules on the card.";
  }
};

export const generateElfSpeech = async (text: string): Promise<AudioBuffer | null> => {
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `(Excited and mystical elf voice) ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is mischievous
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );

    return audioBuffer;
  } catch (error) {
    console.error("Error generating elf speech:", error);
    return null;
  }
};