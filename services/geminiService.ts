
import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const recognizePlate = async (base64Image: string): Promise<RecognitionData> => {
  const modelName = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Please analyze this image of a vehicle and identify the license plate information. 
          Extract the plate number clearly. Also identify the region/country if possible, and provide vehicle details (make, model, color, type).
          Return the data in a structured JSON format.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plate_number: { type: Type.STRING, description: "The alphanumeric characters on the license plate." },
          region: { type: Type.STRING, description: "The state, province, or country of the plate." },
          vehicle_make: { type: Type.STRING, description: "Brand of the vehicle (e.g., Toyota, Tesla)." },
          vehicle_model: { type: Type.STRING, description: "Model of the vehicle (e.g., Camry, Model 3)." },
          vehicle_color: { type: Type.STRING, description: "Predominant color of the vehicle." },
          vehicle_type: { type: Type.STRING, description: "Type of vehicle (e.g., Sedan, SUV, Truck)." },
          confidence_score: { type: Type.STRING, description: "Confidence level (High, Medium, Low)." },
        },
        required: ["plate_number", "region", "vehicle_make", "vehicle_model", "vehicle_color", "vehicle_type", "confidence_score"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to get response from AI");
  
  return JSON.parse(text) as RecognitionData;
};
