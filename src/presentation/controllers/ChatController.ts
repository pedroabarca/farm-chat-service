// Import required dependencies
import type { Request, Response } from "express"; // Express types for request and response
import ChatService from "../../application/services/ChatService"; // Import ChatService to process messages

class ChatController {
    /**
     * Handles incoming chat messages.
     * @route   POST /api/chat
     * @param   req - Express request object
     * @param   res - Express response object
     * @returns JSON response containing AI-generated message
     */
    static async handleChat(req: Request, res: Response): Promise<void> {
        try {
            // Extract message from the request body
            const { message } = req.body;

            // Validate that a message is provided
            if (!message) {
                res.status(400).json({ error: "Message is required." });
                return;
            }

            // Process the message using the ChatService
            const response = await ChatService.processMessage(message);

            // Return the generated response
            res.json({ response });
        } catch (error) {
            console.error("Error processing the chat message:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
}

export default ChatController;
