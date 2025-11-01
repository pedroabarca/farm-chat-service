import express from "express";
import type { Express } from "express"; // ✅ Use `import type` for Express
import cors from "cors";
import chatRoutes from "./presentation/routes/chatRoutes";
import webhookRoutes from "./presentation/routes/webhook";
import setupSwagger from "./shared/swagger.config"; // ✅ Import Swagger setup function

// Initialize the Express application with the correct type
const app: Express = express(); // ✅ Now `app` matches the expected `Express` type

// Configure middleware
app.use(cors());
app.use(express.json());

// 📌 Register chat routes
app.use("/api/chat", chatRoutes);
// ✅ Register webhook routes
app.use("/webhook", webhookRoutes);

// 📄 Setup Swagger documentation
setupSwagger(app); // ✅ No TypeScript error now

// Define the server port
const PORT: number = Number(process.env.PORT);

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Chat service running at http://localhost:${PORT}`);
});
