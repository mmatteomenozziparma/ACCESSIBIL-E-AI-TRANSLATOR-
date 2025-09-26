import { GoogleGenAI } from "@google/genai";
import { LANGUAGES } from "../constants";

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

export const detectLanguage = async (text: string): Promise<string> => {
  const prompt = `Detect the language of the following text. Respond with ONLY the English name of the language (e.g., "English", "French", "Japanese"). Text: "${text}"`;
  try {
    const response = await ai.models.generateContent({
      model: geminiFlash,
      contents: prompt,
    });
    const langName = response.text;
    const foundLang = LANGUAGES.find(lang => lang.name.toLowerCase() === langName.trim().toLowerCase());
    if (foundLang) {
      return foundLang.code;
    }
    throw new Error(`Detected language "${langName}" is not supported.`);
  } catch (error) {
    console.error("Error detecting language:", error);
    throw new Error("Failed to detect language.");
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
  const prompt = `You are an expert in Augmentative and Alternative Communication (AAC) systems. Your task is to convert the following text in ${lang} into a sequence of core vocabulary words suitable for an AAC device.

Follow these critical AAC standards:
1.  **Simplify Grammar:** Reduce the sentence to its essential meaning. Remove articles (a, an, the), verb conjugations, plurals, and filler words.
2.  **Focus on Core Words:** Prioritize high-frequency, reusable words (e.g., "I", "want", "go", "more", "help", "drink", "eat").
3.  **Extract Intent:** Identify the primary intent of the message, not just the literal words.
4.  **Output Format:** Separate each word with a hyphen surrounded by spaces ( - ). Provide ONLY the keyword sequence.

For example, for the input "I would really like to have a big glass of cold water because I'm very thirsty", the correct output is: "I - want - drink - water".

Now, process the following text: "${text}"`;
  return generateContent(prompt);
};