import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateSmartReply = async (messageText, context = "") => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
      Context: You are a smart WhatsApp assistant.
      User message: "${messageText}"
      ${context ? `Additional Context: ${context}` : ""}
      
      Task: Generate a concise, helpful, and natural response.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return null; // Fallback or ignore
    }
};
