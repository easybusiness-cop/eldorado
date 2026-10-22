import dotenv from "dotenv";

// Load local and deployment environment files before server modules initialize.
dotenv.config({ path: [".env.local", ".env"] });
