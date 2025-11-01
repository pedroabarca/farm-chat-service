/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API for interacting with the AI chat service
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message to the AI chat service
 *     description: Processes a user message and returns an AI-generated response.
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Hello, how are you?"
 *     responses:
 *       200:
 *         description: Successfully received response from AI.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: "I'm fine, how can I help you?"
 *       400:
 *         description: Bad request (missing message field)
 *       500:
 *         description: Internal server error
 */
