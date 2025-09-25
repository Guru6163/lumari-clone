import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ContentBlock, TextBlock } from '@anthropic-ai/sdk/resources';

const openai = new OpenAI();
const anthropic = new Anthropic();

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ModelResponse {
    content: string;
    model: 'openai' | 'claude';
}

export class ModelService {
    /**
     * Generate a response using OpenAI as primary, with Claude as fallback
     */
    static async generateResponse(
        messages: ChatMessage[],
        systemPrompt?: string,
        maxTokens: number = 8000
    ): Promise<ModelResponse> {
        try {
            // Try OpenAI first
            console.log('Attempting to use OpenAI...');
            const openaiResponse = await this.callOpenAI(messages, systemPrompt, maxTokens);
            return {
                content: openaiResponse,
                model: 'openai'
            };
        } catch (openaiError) {
            console.error('OpenAI failed, falling back to Claude:', openaiError);
            
            try {
                // Fallback to Claude
                console.log('Falling back to Claude...');
                const claudeResponse = await this.callClaude(messages, systemPrompt, maxTokens);
                return {
                    content: claudeResponse,
                    model: 'claude'
                };
            } catch (claudeError) {
                console.error('Both OpenAI and Claude failed:', claudeError);
                throw new Error('All AI models failed. Please try again later.');
            }
        }
    }

    /**
     * Call OpenAI API
     */
    private static async callOpenAI(
        messages: ChatMessage[],
        systemPrompt?: string,
        maxTokens: number = 8000
    ): Promise<string> {
        const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        
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

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openaiMessages,
            max_tokens: maxTokens,
            temperature: 0.7
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        return content;
    }

    /**
     * Call Claude API
     */
    private static async callClaude(
        messages: ChatMessage[],
        systemPrompt?: string,
        maxTokens: number = 8000
    ): Promise<string> {
        // Convert messages to Claude format
        const claudeMessages: any[] = [];
        
        for (const message of messages) {
            if (message.role !== 'system') {
                claudeMessages.push({
                    role: message.role,
                    content: message.content
                });
            }
        }

        const response = await anthropic.messages.create({
            messages: claudeMessages,
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: maxTokens,
            system: systemPrompt || undefined
        });

        const content = (response.content[0] as TextBlock)?.text;
        if (!content) {
            throw new Error('No content received from Claude');
        }

        return content;
    }

    /**
     * Simple classification call (for template endpoint)
     */
    static async classifyProject(prompt: string): Promise<string> {
        try {
            // Try OpenAI first
            console.log('Attempting to classify with OpenAI...');
            const response = await openai.chat.completions.create({
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

            const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
            if (answer === 'node' || answer === 'react') {
                return answer;
            }
            throw new Error('Invalid response from OpenAI');
        } catch (openaiError) {
            console.error('OpenAI classification failed, falling back to Claude:', openaiError);
            
            try {
                // Fallback to Claude
                console.log('Falling back to Claude for classification...');
                const response = await anthropic.messages.create({
                    messages: [{
                        role: 'user', 
                        content: prompt
                    }],
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 200,
                    system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
                });

                const answer = (response.content[0] as TextBlock).text.trim().toLowerCase();
                if (answer === 'node' || answer === 'react') {
                    return answer;
                }
                throw new Error('Invalid response from Claude');
            } catch (claudeError) {
                console.error('Both OpenAI and Claude classification failed:', claudeError);
                throw new Error('All AI models failed for classification. Please try again later.');
            }
        }
    }
}
