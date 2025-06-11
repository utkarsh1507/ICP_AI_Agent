// Simple command parser that bypasses LangChain agent
import { tools } from './utils/tools.js';

export function parseSimpleCommand(command) {
  const lowerCommand = command.toLowerCase().trim();
  
  // Mint tokens command: "mint 100 tokens" or "mint 100 tokens to 2vxsx-fae"
  if (lowerCommand.includes('mint') && lowerCommand.includes('tokens')) {
    const amountMatch = lowerCommand.match(/mint\s+(\d+)\s+tokens/);
    const toMatch = lowerCommand.match(/to\s+([a-z0-9\-]+)/);
    
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]);
      const to = toMatch ? toMatch[1] : "2vxsx-fae";
      return {
        tool: "mint_tokens",
        params: { amount, to }
      };
    }
  }
  
  // Transfer tokens command: "transfer 50 tokens to vcbh3-..." or "send 50 tokens to vcbh3-..."
  if ((lowerCommand.includes('transfer') || lowerCommand.includes('send')) && lowerCommand.includes('tokens')) {
    const amountMatch = lowerCommand.match(/(?:transfer|send)\s+(\d+)\s+tokens/);
    const toMatch = lowerCommand.match(/to\s+([a-z0-9\-]+)/);
    
    if (amountMatch && toMatch) {
      const amount = parseInt(amountMatch[1]);
      const to = toMatch[1];
      return {
        tool: "transfer_tokens",
        params: { amount, to }
      };
    }
  }
  
  // Check balance command: "check balance of 2vxsx-fae", "balance 2vxsx-fae", or "what's the balance of 2vxsx-fae"
  if (lowerCommand.includes('balance')) {
    const principalMatch = lowerCommand.match(/(?:balance\s+(?:of\s+)?|check\s+balance\s+(?:of\s+)?|what'?s\s+the\s+balance\s+of\s+)([a-z0-9\-]+)/);
    
    if (principalMatch) {
      const principal = principalMatch[1];
      return {
        tool: "check_balance",
        params: { principal }
      };
    }
  }
  
  // Schedule transfer command: "schedule 10 tokens to vcbh3-... every week"
  if (lowerCommand.includes('schedule') && lowerCommand.includes('tokens')) {
    const amountMatch = lowerCommand.match(/schedule\s+(\d+)\s+tokens/);
    const toMatch = lowerCommand.match(/to\s+([a-z0-9\-]+)/);
    const frequencyMatch = lowerCommand.match(/every\s+(day|week)/);
    
    if (amountMatch && toMatch && frequencyMatch) {
      const amount = parseInt(amountMatch[1]);
      const to = toMatch[1];
      const frequency = frequencyMatch[1];
      return {
        tool: "schedule_transfer",
        params: { amount, to, frequency }
      };
    }
  }
  
  return { error: "Command not recognized. Supported commands:\n• 'mint 100 tokens' or 'mint 100 tokens to <principal>'\n• 'transfer 50 tokens to <principal>'\n• 'check balance of <principal>'\n• 'schedule 10 tokens to <principal> every week/day'" };
}

export async function executeSimpleCommand(command) {
  try {
    console.log("Parsing simple command:", command);
    const parsed = parseSimpleCommand(command);
    
    if (parsed.error) {
      return { error: parsed.error };
    }
    
    console.log("Parsed command:", parsed);
    
    // Find the tool
    const tool = tools.find(t => t.name === parsed.tool);
    if (!tool) {
      return { error: `Tool ${parsed.tool} not found` };
    }
    
    // Call the tool with JSON string input (like the agent would)
    const input = JSON.stringify(parsed.params);
    console.log("Calling tool with input:", input);
    
    const result = await tool._call(input);
    console.log("Tool result:", result);
    
    return { success: true, result };
    
  } catch (error) {
    console.error("Simple command execution failed:", error);
    return { error: error.message };
  }
}
