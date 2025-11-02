import Groq from "groq-sdk";
import farmApiStructure from "../../config/farmApi"; // ✅ Import API structure

class ChatModel {
    private model: string;
    private groq: Groq;

    // 🚧 DEVELOPMENT MODE: Fallback models for rate limit handling
    // In production, upgrade to Groq Dev Tier instead of using fallback
    // https://console.groq.com/settings/billing
    private primaryModel: string = "llama-3.3-70b-versatile"; // High accuracy, more tokens
    private fallbackModel: string = "llama3-8b-8192"; // Lower accuracy, fewer tokens

    constructor(model: string = "llama-3.3-70b-versatile") {
        this.model = model;
        this.primaryModel = model;
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

        **IMPORTANT - Language Rule:**
        - ALWAYS respond in the SAME EXACT language the user used in their question
        - If the user asked in English, you MUST respond in English
        - If the user asked in Spanish, you MUST respond in Spanish
        - Detect the language from the user's message and match it exactly

        Convert the API data into a short, natural-sounding response in the user's language.

        Example (English):
        - Question: "How many cows are in the farm?"
        - API Data: { "count": 150 }
        - AI Response: "Your farm has 150 cows."

        Example (Spanish):
        - Question: "¿Cuántas vacas hay en la finca?"
        - API Data: { "count": 150 }
        - AI Response: "Tu finca tiene 150 vacas."

        User: "${message}"
        AI:
        `;
            }

            // 🚧 DEVELOPMENT MODE: Try primary model, fallback to smaller model on rate limit
            // TODO PRODUCTION: Remove fallback logic after upgrading to Groq Dev Tier
            try {
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
            } catch (primaryError: any) {
                // Check if error is rate limit (429)
                if (primaryError?.status === 429) {
                    console.warn(`⚠️ Rate limit hit on ${this.model}, falling back to ${this.fallbackModel}`);
                    console.warn("🚧 DEVELOPMENT MODE: Using fallback model. In production, upgrade to Groq Dev Tier.");

                    // Retry with fallback model
                    try {
                        const fallbackResponse = await this.groq.chat.completions.create({
                            messages: [
                                {
                                    role: "user",
                                    content: prompt
                                }
                            ],
                            model: this.fallbackModel,
                            temperature: 0.3,
                            max_tokens: 1024,
                        });

                        console.log(`✅ Fallback model ${this.fallbackModel} succeeded`);
                        return fallbackResponse.choices[0]?.message?.content || "";
                    } catch (fallbackError) {
                        console.error("❌ Fallback model also failed:", fallbackError);
                        throw primaryError; // Throw original error
                    }
                }

                // If not rate limit error, throw it
                throw primaryError;
            }
        } catch (error) {
            console.error("❌ Error generating AI response:", error);
            throw new Error("AI response generation failed.");
        }
    }
}

export default ChatModel;
