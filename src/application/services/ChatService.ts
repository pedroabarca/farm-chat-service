
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

                    if (apiQuery.method === "POST") {
                        console.log("🔗 Calling POST Farm API:", apiQuery);
                        // ✅ Properly handle POST requests
                        response = await axios.post(`${farmApiUrl}${apiQuery.endpoint}`,apiQuery.parameters);
                        console.log("🔗 Farm response:", response);
                    } else {
                        console.log("🔗 Calling GET Farm API:", apiQuery);
                        // ✅ Handle GET requests
                        response = await axios.get(`${farmApiUrl}${apiQuery.endpoint}`, {
                            params: apiQuery.parameters || {} // Send parameters in query string
                        });
                    }

                    // ✅ Step 5: Convert API response into natural language
                    return await ChatService.formatResponse(message, response.data);
                }
            } catch (parseError) {
                console.log("💬 AI Response is not an API query, returning normal AI response.", parseError);
            }

            return aiResponse;
        } catch (error) {
            console.error("❌ Error processing chat message:", error);
            return "An error occurred while processing your request.";
        }
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
