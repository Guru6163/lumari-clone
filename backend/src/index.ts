require("dotenv").config();
import express from "express";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import { ModelService } from "./modelService";
import cors from "cors";
const app = express();

app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // if you use cookies or authentication
}));

// Add cross-origin isolation headers for all responses
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json())

app.post("/template", async (req, res) => {
    try {
        const prompt = req.body.prompt;
        
        const answer = await ModelService.classifyProject(prompt);
        
        if (answer === "react") {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            })
            return;
        }

        if (answer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            })
            return;
        }

        res.status(403).json({message: "You cant access this"})
        return;
    } catch (error: any) {
        console.error("Error in /template endpoint:", error);
        res.status(500).json({
            error: true,
            message: error.message || "An error occurred while processing your request"
        });
    }
})

app.post("/chat", async (req, res) => {
    try {
        const messages = req.body.messages;
        const response = await ModelService.generateResponse(
            messages,
            getSystemPrompt(),
            8000
        );

        console.log(`Response generated using ${response.model}`);

        res.json({
            response: response.content
        });
    } catch (error: any) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({
            error: true,
            message: error.message || "An error occurred while processing your request"
        });
    }
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
