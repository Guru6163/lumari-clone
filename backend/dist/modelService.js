"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelService = void 0;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai = new openai_1.default();
const anthropic = new sdk_1.default();
class ModelService {
    /**
     * Generate a response using OpenAI as primary, with Claude as fallback
     */
    static generateResponse(messages_1, systemPrompt_1) {
        return __awaiter(this, arguments, void 0, function* (messages, systemPrompt, maxTokens = 8000) {
            try {
                // Try OpenAI first
                console.log('Attempting to use OpenAI...');
                const openaiResponse = yield this.callOpenAI(messages, systemPrompt, maxTokens);
                return {
                    content: openaiResponse,
                    model: 'openai'
                };
            }
            catch (openaiError) {
                console.error('OpenAI failed, falling back to Claude:', openaiError);
                try {
                    // Fallback to Claude
                    console.log('Falling back to Claude...');
                    const claudeResponse = yield this.callClaude(messages, systemPrompt, maxTokens);
                    return {
                        content: claudeResponse,
                        model: 'claude'
                    };
                }
                catch (claudeError) {
                    console.error('Both OpenAI and Claude failed:', claudeError);
                    throw new Error('All AI models failed. Please try again later.');
                }
            }
        });
    }
    /**
     * Call OpenAI API
     */
    static callOpenAI(messages_1, systemPrompt_1) {
        return __awaiter(this, arguments, void 0, function* (messages, systemPrompt, maxTokens = 8000) {
            var _a, _b;
            const openaiMessages = [];
            // Add system message if provided
            if (systemPrompt) {
                openaiMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }
            // Add conversation messages
            for (const message of messages) {
                openaiMessages.push({
                    role: message.role,
                    content: message.content
                });
            }
            const response = yield openai.chat.completions.create({
                model: 'gpt-4o',
                messages: openaiMessages,
                max_tokens: maxTokens,
                temperature: 0.7
            });
            const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
            if (!content) {
                throw new Error('No content received from OpenAI');
            }
            return content;
        });
    }
    /**
     * Call Claude API
     */
    static callClaude(messages_1, systemPrompt_1) {
        return __awaiter(this, arguments, void 0, function* (messages, systemPrompt, maxTokens = 8000) {
            var _a;
            // Convert messages to Claude format
            const claudeMessages = [];
            for (const message of messages) {
                if (message.role !== 'system') {
                    claudeMessages.push({
                        role: message.role,
                        content: message.content
                    });
                }
            }
            const response = yield anthropic.messages.create({
                messages: claudeMessages,
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: maxTokens,
                system: systemPrompt || undefined
            });
            const content = (_a = response.content[0]) === null || _a === void 0 ? void 0 : _a.text;
            if (!content) {
                throw new Error('No content received from Claude');
            }
            return content;
        });
    }
    /**
     * Simple classification call (for template endpoint)
     */
    static classifyProject(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                // Try OpenAI first
                console.log('Attempting to classify with OpenAI...');
                const response = yield openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.1
                });
                const answer = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
                if (answer === 'node' || answer === 'react') {
                    return answer;
                }
                throw new Error('Invalid response from OpenAI');
            }
            catch (openaiError) {
                console.error('OpenAI classification failed, falling back to Claude:', openaiError);
                try {
                    // Fallback to Claude
                    console.log('Falling back to Claude for classification...');
                    const response = yield anthropic.messages.create({
                        messages: [{
                                role: 'user',
                                content: prompt
                            }],
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 200,
                        system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
                    });
                    const answer = response.content[0].text.trim().toLowerCase();
                    if (answer === 'node' || answer === 'react') {
                        return answer;
                    }
                    throw new Error('Invalid response from Claude');
                }
                catch (claudeError) {
                    console.error('Both OpenAI and Claude classification failed:', claudeError);
                    throw new Error('All AI models failed for classification. Please try again later.');
                }
            }
        });
    }
}
exports.ModelService = ModelService;
