// Test tools directly without OpenAI agent
import { tools } from './utils/tools.js';

export async function testMintTokensDirect() {
  try {
    console.log("Testing MintTokensTool directly...");
    const mintTool = tools.find(tool => tool.name === "mint_tokens");
    
    if (!mintTool) {
      console.error("MintTokensTool not found!");
      return;
    }
    
    // Test with string input (like the agent would send)
    const testInput = '{ "amount": 100, "to": "2vxsx-fae" }';
    console.log("Calling mint tool with input:", testInput);
    
    const result = await mintTool._call(testInput);
    console.log("Direct tool result:", result);
    
    return result;
  } catch (error) {
    console.error("Direct tool test failed:", error);
    return { error: error.message };
  }
}

export async function testAllToolsDirect() {
  console.log("Testing all tools directly...");
  
  const tests = [
    {
      name: "mint_tokens",
      input: '{ "amount": 100, "to": "2vxsx-fae" }'
    },
    {
      name: "check_balance", 
      input: '{ "principal": "2vxsx-fae" }'
    }
  ];
  
  for (const test of tests) {
    try {
      const tool = tools.find(t => t.name === test.name);
      if (tool) {
        console.log(`\n--- Testing ${test.name} ---`);
        console.log("Input:", test.input);
        const result = await tool._call(test.input);
        console.log("Result:", result);
      }
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error);
    }
  }
}
