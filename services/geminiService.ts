import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const geminiFlash = 'gemini-2.5-flash';

const generateContent = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: geminiFlash,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to get response from AI model.");
  }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };
  const textPart = {
    text: 'Extract all text from this image. If no text is found, return an empty string.',
  };
  try {
    const response = await ai.models.generateContent({
      model: geminiFlash,
      contents: { parts: [imagePart, textPart] },
    });
    return response.text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("Failed to extract text from image.");
  }
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translated text, without any introductory phrases. Text: "${text}"`;
  return generateContent(prompt);
};

export const simplifyText = async (text: string, lang: string, level: number): Promise<string> => {
  const prompt = `Rewrite the following text in ${lang} to be very simple and easy to understand, at a simplicity level of ${level} out of 15 (where 15 is the simplest). Provide only the simplified text. Text: "${text}"`;
  return generateContent(prompt);
};

export const generateAAC = async (text: string, lang: string): Promise<string> => {
  const prompt = `You are an expert in Augmentative and Alternative Communication (AAC). For the following text in ${lang}, generate a sequence of simple, concrete keywords that could be represented by AAC symbols. Separate each keyword with a hyphen surrounded by spaces ( - ). For example, for "I want to go to the park to play", the output should be "I - want - go - park - play". Provide only the keyword sequence. Text: "${text}"`;
  return generateContent(prompt);
};