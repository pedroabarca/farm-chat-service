
import axios from "axios";
import ChatModel from "../../domain/Models/ChatModel";

const chatModel = new ChatModel("llama-3.3-70b-versatile");

class ChatService {
    /**
     * Processes user messages and determines if an API call is needed.
     * @param message - The user's message
     * @returns AI-generated response or farm data from the API
     */
    static async processMessage(message: string): Promise<string> {
        try {
            // 🧠 Step 1: LLM analyzes if the message requires a farm API request
            let aiResponse = await chatModel.generateResponse(message, "query");

            // 🛠 Step 2: Extract JSON from LLM response if wrapped in a code block
            aiResponse = ChatService.extractJson(aiResponse);

            // 🛠 Step 3: Try to parse JSON response from LLM (API query)
            try {
                const apiQuery = JSON.parse(aiResponse);

                if (apiQuery.endpoint) {
                    // ✅ Step 4: Call the Farm Management API with the correct method
                    const farmApiUrl = process.env.FARM_API_URL || "http://localhost:5205";
                    let response;

                    try {
                        if (apiQuery.method === "POST") {
                            console.log("🔗 Calling POST Farm API:", apiQuery);
                            response = await axios.post(`${farmApiUrl}${apiQuery.endpoint}`,apiQuery.parameters);
                            console.log("✅ Farm API POST succeeded");
                        } else {
                            console.log("🔗 Calling GET Farm API:", apiQuery);
                            response = await axios.get(`${farmApiUrl}${apiQuery.endpoint}`, {
                                params: apiQuery.parameters || {}
                            });
                            console.log("✅ Farm API GET succeeded");
                        }

                        // ✅ Step 5: Convert API response into natural language
                        return await ChatService.formatResponse(message, response.data);
                    } catch (apiError: any) {
                        // 🚨 Handle API errors with user-friendly messages
                        console.error("❌ Farm API Error:", apiError.response?.status, apiError.response?.data);
                        return ChatService.formatApiError(apiError, apiQuery.method, message);
                    }
                }
            } catch (parseError) {
                console.log("💬 AI Response is not an API query, returning normal AI response.");
            }

            return aiResponse;
        } catch (error) {
            console.error("❌ Error processing chat message:", error);

            // Detect language for error message
            const isSpanish = message && /\b(añadir|agregar|mostrar|listar|vacas|animales|peso|salud|registrar|criar|es|la|pura)\b/i.test(message);

            return isSpanish
                ? "Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."
                : "An error occurred while processing your request. Please try again.";
        }
    }

    /**
     * Formats API errors into user-friendly messages in English or Spanish.
     * @param error - Axios error object
     * @param method - HTTP method (GET/POST/PUT/DELETE)
     * @param userMessage - Original user message (to detect language)
     * @returns User-friendly error message
     */
    static formatApiError(error: any, method: string, userMessage?: string): string {
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Detect language from user message (simple detection)
        const isSpanish = userMessage && /\b(añadir|agregar|mostrar|listar|vacas|animales|peso|salud|registrar|criar)\b/i.test(userMessage);

        // Network/connection errors
        if (!status) {
            return isSpanish
                ? "❌ Lo siento, no pude conectarme al sistema de gestión de finca. Por favor, inténtalo de nuevo en un momento."
                : "❌ Sorry, I couldn't connect to the farm management system. Please try again in a moment.";
        }

        // 400 - Validation errors
        if (status === 400) {
            if (errorData?.details) {
                const fieldErrors = Object.entries(errorData.details)
                    .map(([field, errors]: [string, any]) => `• ${field}: ${errors.join(", ")}`)
                    .join("\n");
                return isSpanish
                    ? `❌ Falta información o hay datos incorrectos:\n\n${fieldErrors}\n\nPor favor, verifica e intenta de nuevo.`
                    : `❌ Some information is missing or incorrect:\n\n${fieldErrors}\n\nPlease check and try again.`;
            }
            return isSpanish
                ? "❌ La información proporcionada está incompleta o es inválida. Por favor, verifica tus datos e intenta de nuevo."
                : "❌ The information provided is incomplete or invalid. Please check your data and try again.";
        }

        // 404 - Not found
        if (status === 404) {
            if (method === "GET") {
                return isSpanish
                    ? "❌ No pude encontrar ese animal o registro. Por favor, verifica el nombre o ID de etiqueta e intenta de nuevo."
                    : "❌ I couldn't find that animal or record. Please check the name or tag ID and try again.";
            }
            return isSpanish
                ? "❌ El recurso solicitado no fue encontrado."
                : "❌ The requested resource was not found.";
        }

        // 409 - Conflict (duplicate)
        if (status === 409) {
            return isSpanish
                ? "❌ Este registro ya existe (ID de etiqueta o nombre duplicado). Por favor, usa un identificador diferente."
                : "❌ This record already exists (duplicate tag ID or name). Please use a different identifier.";
        }

        // 500 - Server error
        if (status >= 500) {
            return isSpanish
                ? "❌ El sistema de gestión de finca encontró un error. Nuestro equipo ha sido notificado. Por favor, intenta más tarde."
                : "❌ The farm management system encountered an error. Our team has been notified. Please try again later.";
        }

        // Generic error
        return isSpanish
            ? "❌ Algo salió mal. Por favor, intenta de nuevo o contacta soporte si el problema persiste."
            : "❌ Something went wrong. Please try again or contact support if the problem persists.";
    }

    /**
     * Extracts JSON content from LLM response if wrapped in a code block.
     * @param response - Raw r     * @returns Cleaned JSON string
     */
    static extractJson(response: string): string {
        // ✅ Match JSON inside a Markdown block (```json ... ```)
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            return jsonMatch[1].trim(); // ✅ Extract only the JSON content
        }
        return response; // ✅ Return the original response if no match
    }

    /**
     * Converts raw API data into a user-friendly natural language response using LLM.
     * @param userQuestion - The original question from the user
     * @param apiData - Raw data received from the Farm API
     * @returns A formatted response for the user
     */
    static async formatResponse(userQuestion: string, apiData: any): Promise<string> {
        try {
            console.log("🔄 Formatting API response with AI...");

            // ✅ Now we call ChatModel in "format" mode
            const formattedResponse = await chatModel.generateResponse(userQuestion, "format", apiData);

            console.log("✅ AI-Formatted Response:", formattedResponse);
            return formattedResponse;
        } catch (error) {
            console.error("❌ Error formatting response:", error);
            return "I retrieved the farm data but couldn't format it properly.";
        }
    }
}

export default ChatService;
