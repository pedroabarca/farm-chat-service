import Groq from "groq-sdk";
import farmApiStructure from "../../config/farmApi"; // ✅ Import API structure

class ChatModel {
    private model: string;
    private groq: Groq;

    constructor(model: string = "llama-3.3-70b-versatile") {
        this.model = model;
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }

    /**
     * Converts a user question into either an API query or a natural response.
     * @param message - The user's message
     * @param mode - "query" for API query conversion, "format" for response formatting
     * @param apiData - (Optional) API response data when formatting a response
     * @returns AI-generated structured query or natural response
     */
    async generateResponse(message: string, mode: "query" | "format", apiData?: any): Promise<string> {
        try {
            let prompt = "";

            if (mode === "query") {
                // 📌 **Mode 1: Convert User Question into API Query (Uses API Structure)**
                prompt = `${farmApiStructure}

        User: ${message}
        AI:
        `;
            } else if (mode === "format") {
                // 📌 **Mode 2: Convert API Response into Natural Text**
                prompt = `
        User asked: "${message}".
        The farm system responded with this data: ${JSON.stringify(apiData)}.
        Convert this into a short, natural-sounding response always respond only using the same
        language the user used or asked: spanish or english

        Example:
        - Question: "How many cows are in the farm?"
        - API Data: { "count": 150 }
        - AI Response: "Your farm has 150 cows."

        User: "${message}"
        AI:
        `;
            }

            const response = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.3,
                max_tokens: 1024,
            });

            return response.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("❌ Error generating AI response:", error);
            throw new Error("AI response generation failed.");
        }
    }
}

export default ChatModel;
