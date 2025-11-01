import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

// Define Swagger options
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Farm Chat Service API",
            version: "1.0.0",
            description: "API documentation for the Farm Chat Service",
        },
        servers: [
            {
                url: "http://localhost:3001",
                description: "Local Development Server",
            },
        ],
    },
    apis: ["./src/docs/chatDocs.ts"], // ✅ Load the new Swagger docs file
};

// Generate the Swagger specification
const swaggerDocs = swaggerJsDoc(swaggerOptions);

/**
 * Function to setup Swagger in the Express app
 * @param app Express application instance
 */
const setupSwagger = (app: Express): void => {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    console.log("📄 Swagger docs available at http://localhost:3001/api/docs");
};

export default setupSwagger;
