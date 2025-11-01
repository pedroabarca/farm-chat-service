// Import required dependencies
import { Router } from "express"; // Express Router to define API routes
import ChatController from "../controllers/ChatController"; // Import the ChatController

// Create a new router instance
const router: Router = Router();

/**
 * @route   POST /api/chat
 * @desc    Processes a chat message and returns a response from the AI model
 * @access  Public
 */
router.post("/", ChatController.handleChat);

// Export the router for use in server.ts
export default router;
