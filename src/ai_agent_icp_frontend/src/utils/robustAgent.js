import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { tools } from './tools';
import { agentPrompt } from './prompts';

class RobustAgent {
  constructor() {
    this.agent = null;
    this.isInitialized = false;
    this.initializationError = null;
  }
  async initialize() {
    try {
      const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
      
      if (!apiKey) {
        throw new Error('Hugging Face API key is missing. Please set VITE_HUGGINGFACE_API_KEY in your .env file.');
      }      // Create LLM with Hugging Face Inference API
      const llm = new HuggingFaceInference({
        model: "HuggingFaceH4/zephyr-7b-beta", // Available instruction following model
        apiKey,
        temperature: 0.1, // Lower temperature for more consistent responses
        maxTokens: 512, // Limit response length
        timeout: 30000, // 30 second timeout
      });

      // Create agent with timeout protection
      this.agent = await initializeAgentExecutorWithOptions(tools, llm, {
        agentType: "zero-shot-react-description",
        verbose: true,
        prompt: agentPrompt,
        maxIterations: 3, // Limit iterations to prevent loops
        maxExecutionTime: 30000, // 30 second total timeout
      });

      this.isInitialized = true;
      console.log("Robust agent initialized successfully with Hugging Face");
      return true;

    } catch (error) {
      this.initializationError = error.message;
      console.error("Agent initialization failed:", error);
      return false;
    }
  }

  async executeCommand(command) {
    if (!this.isInitialized) {
      throw new Error("Agent not initialized. " + (this.initializationError || "Unknown error"));
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Agent command timed out after 30 seconds')), 30000);
    });

    try {
      console.log("Executing command with robust agent:", command);
      
      // Race between agent execution and timeout
      const result = await Promise.race([
        this.agent.invoke({ input: command }),
        timeoutPromise
      ]);

      return {
        success: true,
        result: result.output,
        source: 'langchain'
      };    } catch (error) {
      console.error("Robust agent execution failed:", error);
      
      // Categorize errors for better handling
      if (error.message.includes('429') || error.message.includes('Too Many Requests') || error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          errorType: 'rate_limit',
          source: 'langchain'
        };
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return {
          success: false,
          error: 'Request timed out. The Hugging Face service may be slow or unavailable.',
          errorType: 'timeout',
          source: 'langchain'
        };
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return {
          success: false,
          error: 'Invalid Hugging Face API key. Please check your credentials.',
          errorType: 'auth',
          source: 'langchain'
        };
      } else {
        return {
          success: false,
          error: `AI execution failed: ${error.message}`,
          errorType: 'unknown',
          source: 'langchain'
        };
      }
    }
  }

  isReady() {
    return this.isInitialized;
  }

  getInitializationError() {
    return this.initializationError;
  }
}

export const robustAgent = new RobustAgent();
