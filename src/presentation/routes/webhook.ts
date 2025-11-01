import bodyParser from "body-parser";
import express, { type Request, type Response, type Router } from "express"; // Express types for request and response
import ChatService from "../../application/services/ChatService"; // Import ChatService
import axios from "axios";

const router: Router = express.Router();
// Load variables from .env
const WHATSAPP_VERIFY_TOKEN: string = process.env.WHATSAPP_VERIFY_TOKEN || "";
const WHATSAPP_ACCESS_TOKEN: string = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID: string = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_API_URL: string = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v17.0";

// Middleware to parse JSON requests
router.use(bodyParser.json());

/**
 * ✅ Webhook Verification for Meta API
 * Meta calls this endpoint to verify the webhook URL.
 */
router.get("/", (req: Request, res: Response): void => {
    const mode: string | undefined = req.query["hub.mode"] as string;
    const token: string | undefined = req.query["hub.verify_token"] as string;
    const challenge: string | undefined = req.query["hub.challenge"] as string;

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully.");
        res.status(200).send(challenge);
    } else {
        console.warn("❌ Webhook verification failed.");
        res.sendStatus(403);
    }
});

/**
 * ✅ Handles incoming WhatsApp messages
 * This endpoint processes messages sent by users via WhatsApp.
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("📩 Incoming WhatsApp Message:", JSON.stringify(req.body, null, 2));

        // Extract message data from Meta's payload
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];

        // ✅ Step 1: Ignore messages sent by the bot (to prevent infinite loops)
        const botPhoneNumber = changes?.value?.metadata?.phone_number_id;
        if (message?.from === botPhoneNumber) {
            console.log("🔄 Ignoring bot's own message to prevent loops.");
            res.sendStatus(200);
            return;
        }

        if (message) {
            const senderId: string = message.from; // User's WhatsApp number
            const text: string = message.text?.body ?? ""; // Extract user message text

            console.log(`💬 Message from ${senderId}: ${text}`);

            // ✅ Step 1: Process the message using ChatService
            const chatResponse = await ChatService.processMessage(text);

            // ✅ Step 2: Send the response back to WhatsApp
            await sendWhatsAppMessage(senderId, chatResponse);
        }

        res.sendStatus(200); // Acknowledge receipt of the message
    } catch (error) {
        console.error("❌ Error processing WhatsApp message:", error);
        res.sendStatus(500);
    }
});

/**
 * ✅ Function to send a response back to WhatsApp via Meta API
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
    try {
        await axios.post(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phoneNumber,
                text: { body: message }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(`✅ Sent message to WhatsApp: ${message}`);
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
        console.error("🚨 Error sending WhatsApp message:", error.response?.data || error.message);
        } else {
            console.error("🚨 Unknown Error:", JSON.stringify(error));
        }
    }
    }

export default router;
