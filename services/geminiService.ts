
import { GoogleGenAI, Type } from "@google/genai";
import { WheelSegment, ElfPersona } from "../types";

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

export const generateElfProfiles = async (): Promise<ElfPersona[]> => {
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate 4 distinct, fun Christmas Elf characters for a game show. Each must have a unique name, a specific 3-word personality description, a full-time North Pole job title, and a favorite pastime (like sipping cocoa). Assign one of these voice IDs to each randomly: Puck, Kore, Charon, Fenrir, Zephyr.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              personality: { type: Type.STRING },
              job: { type: Type.STRING },
              pastime: { type: Type.STRING },
              voice: { type: Type.STRING }
            },
            required: ["id", "name", "personality", "job", "pastime", "voice"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as ElfPersona[];
  } catch (error) {
    console.error("Error generating elf profiles:", error);
    // Fallback profiles
    return [
      { id: '1', name: 'Jingle', personality: 'Cheerful, Loud, Clumsy', job: 'Bell Polisher', pastime: 'Humming carols', voice: 'Puck' },
      { id: '2', name: 'Trixie', personality: 'Clever, Sarcastic, Fast', job: 'List Checker', pastime: 'Racing reindeer', voice: 'Kore' },
      { id: '3', name: 'Barnaby', personality: 'Wise, Old, Slow', job: 'Toy Inspector', pastime: 'Sipping hot cocoa', voice: 'Charon' },
      { id: '4', name: 'Zap', personality: 'Energetic, Hyper, Electric', job: 'Light String Detangler', pastime: 'Eating sugar cubes', voice: 'Fenrir' }
    ];
  }
};

export const generateElfAvatar = async (elf: ElfPersona): Promise<string | undefined> => {
  if (!apiKey) return undefined;

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Using gemini-2.5-flash-image for generation as per guidelines (though typically input, instructions allow generation via generateContent for nano banana series)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
           { text: `A cute, high-quality 3D render style profile picture of a Christmas elf named ${elf.name}. Personality: ${elf.personality}. Job: ${elf.job}. Solid festive background color.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.warn(`Failed to generate image for ${elf.name}`, error);
    return undefined;
  }
};

export const generateCommentary = async (segment: WheelSegment, playerName: string, elf: ElfPersona): Promise<string> => {
  if (!apiKey) {
    return "Ho ho ho! The spirits of Christmas have spoken!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are ${elf.name}, a ${elf.personality} Christmas Elf game show host.
      Your job is ${elf.job} and you love ${elf.pastime}.
      A player named "${playerName}" just spun the Wheel of Christmas and landed on "${segment.label}".
      The rule for this spot is: "${segment.description}".
      
      Give a very short (max 1 sentence) reaction to this result based on your personality.
      
      Keep it family friendly but entertaining.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    return response.text || "The elves are speechless!";
  } catch (error) {
    console.error("Error fetching commentary:", error);
    return "The North Pole connection is snowy today! Just follow the rules on the card.";
  }
};

export const generatePlayerAnnouncement = async (playerName: string, elf: ElfPersona): Promise<string> => {
  if (!apiKey) return `It's ${playerName}'s turn! Give the wheel a spin!`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are ${elf.name}, a ${elf.personality} Christmas Elf game show host.
      Your day job is ${elf.job}.
      It is now "${playerName}"'s turn to spin the wheel.
      
      Write a very short (1 sentence) announcement telling them to spin, using your specific personality style.
      
      Keep it exciting and varied.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    return response.text || `You're up ${playerName}! Spin the wheel!`;
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return `It's ${playerName}'s turn!`;
  }
};

export const generateOrderAnnouncement = async (playerNames: string[], elf: ElfPersona): Promise<string> => {
  if (!apiKey) {
    const first = playerNames[0] || "someone";
    return `Hello! I'm ${elf.name}! ${first} is first! Let's get started!`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are ${elf.name}, a ${elf.personality} Christmas Elf game show host.
      Introduce yourself briefly (Mention you are the ${elf.job}).
      The random order of play has been decided.
      The players are (in order): ${playerNames.join(', ')}.
      
      Write a script announcing this.
      - Start by introducing yourself.
      - Announce that ${playerNames[0]} is the lucky one starting us off.
      - List the others quickly.
      - End exactly with: "Let's get started!"
      
      Keep it under 4 sentences total.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    return response.text || `I'm ${elf.name}! The order is set! ${playerNames[0]} is first. Let's get started!`;
  } catch (error) {
    console.error("Error fetching order announcement:", error);
    return `The order is set! Let's get started!`;
  }
};

export const generateElfSpeech = async (text: string, elf: ElfPersona): Promise<AudioBuffer | null> => {
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        // systemInstruction removed to avoid 500 errors on TTS
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: elf.voice },
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
