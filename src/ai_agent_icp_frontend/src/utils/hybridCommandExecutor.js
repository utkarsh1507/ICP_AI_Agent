import { robustAgent } from './robustAgent';
import { executeSimpleCommand } from '../simpleCommandParser';

class HybridCommandExecutor {
  constructor() {
    this.useAI = true; // Default to trying AI first
    this.consecutiveAIFailures = 0;
    this.maxAIFailures = 3; // After 3 failures, switch to simple parser for a while
  }

  async executeCommand(command, forceMethod = null) {
    console.log("Hybrid executor processing command:", command);
    
    // If forced to use a specific method
    if (forceMethod === 'simple') {
      return await this.executeWithSimpleParser(command);
    } else if (forceMethod === 'ai') {
      return await this.executeWithAI(command);
    }

    // Auto-select method based on recent performance
    const shouldUseAI = this.useAI && this.consecutiveAIFailures < this.maxAIFailures;
    
    if (shouldUseAI && robustAgent.isReady()) {
      console.log("Trying LangChain AI method first...");
      const aiResult = await this.executeWithAI(command);
      
      if (aiResult.success) {
        this.consecutiveAIFailures = 0; // Reset failure counter on success
        return aiResult;
      } else {
        // AI failed, try simple parser as fallback
        console.log("AI failed, falling back to simple parser...");
        this.consecutiveAIFailures++;
        return await this.executeWithFallback(command, aiResult);
      }
    } else {
      // Use simple parser directly
      console.log("Using simple parser (AI unavailable or too many recent failures)...");
      return await this.executeWithSimpleParser(command);
    }
  }

  async executeWithAI(command) {
    try {
      if (!robustAgent.isReady()) {
        return {
          success: false,
          error: "AI agent not ready: " + (robustAgent.getInitializationError() || "Unknown initialization error"),
          errorType: 'not_ready',
          source: 'langchain'
        };
      }

      return await robustAgent.executeCommand(command);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorType: 'execution_error',
        source: 'langchain'
      };
    }
  }

  async executeWithSimpleParser(command) {
    try {
      console.log("Executing with simple parser...");
      const result = await executeSimpleCommand(command);
      
      if (result.error) {
        return {
          success: false,
          error: result.error,
          errorType: 'parse_error',
          source: 'simple_parser'
        };
      } else {
        return {
          success: true,
          result: result.result,
          source: 'simple_parser'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorType: 'execution_error',
        source: 'simple_parser'
      };
    }
  }

  async executeWithFallback(command, aiResult) {
    const simpleResult = await this.executeWithSimpleParser(command);
    
    if (simpleResult.success) {
      return {
        ...simpleResult,
        fallbackUsed: true,
        originalAIError: aiResult.error
      };
    } else {
      // Both methods failed
      return {
        success: false,
        error: `Both AI and simple parser failed.\nAI Error: ${aiResult.error}\nParser Error: ${simpleResult.error}`,
        errorType: 'both_failed',
        source: 'hybrid'
      };
    }
  }

  // Method to manually switch preferred execution method
  setAIEnabled(enabled) {
    this.useAI = enabled;
    this.consecutiveAIFailures = 0; // Reset counter when manually toggling
  }

  getStats() {
    return {
      useAI: this.useAI,
      consecutiveAIFailures: this.consecutiveAIFailures,
      maxAIFailures: this.maxAIFailures,
      agentReady: robustAgent.isReady()
    };
  }
}

export const hybridExecutor = new HybridCommandExecutor();
