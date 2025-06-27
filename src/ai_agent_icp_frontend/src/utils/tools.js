import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Principal } from "@dfinity/principal";
import { ai_agent_icp_backend } from "../../../declarations/ai_agent_icp_backend";

// Helper function to safely stringify objects with BigInt values
const safeStringify = (obj) => {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
};

// Mint tokens tool
class MintTokensTool extends StructuredTool {
  name = "mint_tokens";
  description = "Mint StoreCoin tokens to a specified principal. Parameters: amount (number), to (string, optional, defaults to '2vxsx-fae')";

  async _call(input) {
    try {
      console.log("MintTokensTool raw input:", input); // Debug log
        // Handle string input (parse JSON) or object input
      let params;
      if (typeof input === 'string') {
        try {
          params = JSON.parse(input);
        } catch (e) {
          return safeStringify({ error: "Invalid JSON input format" });
        }
      } else {
        params = input;
      }
      
      console.log("MintTokensTool parsed params:", params); // Debug log
      
      const amount = Number(params.amount);
      const to = params.to || "2vxsx-fae";
      
      if (isNaN(amount) || amount <= 0) {
        return safeStringify({ error: "Amount must be a positive number" });
      }
        console.log("MintTokensTool final values:", { amount, to }); // Debug log
      const principal = Principal.fromText(to);
      const units = BigInt(Math.floor(amount * 1e8)); // Convert STC to units (8 decimals)
      
      console.log("MintTokensTool calling backend with:", {
        owner: principal.toString(),
        subaccount: [],
        amount: units.toString()
      });
      
      const result = await ai_agent_icp_backend.mint(
        { owner: principal, subaccount: [] },
        units
      );
      
      console.log("MintTokensTool backend result:", result);
        // Check if the result indicates success or failure
      if (result.Ok !== undefined) {
        return safeStringify({ success: true, tx_id: Number(result.Ok) });
      } else if (result.Err !== undefined) {
        return safeStringify({ success: false, error: `Mint failed: ${safeStringify(result.Err)}` });
      } else {
        return safeStringify({ success: false, error: "Unknown mint result format", result: result });
      }
    } catch (err) {
      console.error("MintTokensTool error:", err); // Debug log
      return safeStringify({ error: `Mint failed: ${err.message}` });
    }
  }
}

// Transfer tokens tool
class TransferTokensTool extends StructuredTool {
  name = "transfer_tokens";
  description = "Transfer StoreCoin tokens to a specified principal. Parameters: amount (number), to (string)";

  async _call(input) {
    try {
      console.log("TransferTokensTool raw input:", input); // Debug log
        // Handle string input (parse JSON) or object input
      let params;
      if (typeof input === 'string') {
        try {
          params = JSON.parse(input);
        } catch (e) {
          return safeStringify({ error: "Invalid JSON input format" });
        }
      } else {
        params = input;
      }
      
      console.log("TransferTokensTool parsed params:", params); // Debug log
      
      const amount = Number(params.amount);
      const to = params.to;
      
      if (isNaN(amount) || amount <= 0) {
        return safeStringify({ error: "Amount must be a positive number" });
      }
      
      if (!to) {
        return safeStringify({ error: "Principal 'to' is required" });
      }
        console.log("TransferTokensTool final values:", { amount, to }); // Debug log
      const principal = Principal.fromText(to);
      const units = BigInt(Math.floor(amount * 1e8));
      
      console.log("TransferTokensTool calling backend with:", {
        from_subaccount: [],
        to: { owner: principal, subaccount: [] },
        amount: units.toString(),
        fee: [BigInt(10000)].map(f => f.toString()),
        memo: [],
        created_at_time: []
      });
      
      const result = await ai_agent_icp_backend.icrc1_transfer({
        from_subaccount: [],
        to: { owner: principal, subaccount: [] },
        amount: units,
        fee: [BigInt(10000)], // 0.0001 STC fee
        memo: [],
        created_at_time: []
      });
      
      console.log("TransferTokensTool backend result:", result);
        // Check if the result indicates success or failure
      if (result.Ok !== undefined) {
        return safeStringify({ success: true, tx_id: Number(result.Ok) });
      } else if (result.Err !== undefined) {
        return safeStringify({ success: false, error: `Transfer failed: ${safeStringify(result.Err)}` });
      } else {
        return safeStringify({ success: false, error: "Unknown transfer result format", result: result });
      }
    } catch (err) {
      console.error("TransferTokensTool error:", err); // Debug log
      return safeStringify({ error: `Transfer failed: ${err.message}` });
    }
  }
}

// Check balance tool
class CheckBalanceTool extends StructuredTool {
  name = "check_balance";
  description = "Check the StoreCoin balance of a principal.";

  async _call(input) {
    try {
      console.log("CheckBalanceTool raw input:", input); // Debug log
        // Handle string input (parse JSON) or object input
      let params;
      if (typeof input === 'string') {
        try {
          params = JSON.parse(input);
        } catch (e) {
          return safeStringify({ error: "Invalid JSON input format" });
        }
      } else {
        params = input;
      }
      
      console.log("CheckBalanceTool parsed params:", params); // Debug log
      
      const principal = params.principal;
      if (!principal) {
        return safeStringify({ error: "Principal is required" });
      }
      
      const principalId = Principal.fromText(principal);
      const balance = await ai_agent_icp_backend.icrc1_balance_of({
        owner: principalId,
        subaccount: []
      });
      const stc = Number(balance) / 1e8; // Convert units to STC
      return safeStringify({ success: true, balance: stc });
    } catch (err) {
      console.error("CheckBalanceTool error:", err); // Debug log
      return safeStringify({ error: `Balance check failed: ${err.message}` });
    }
  }
}

// Schedule transfer tool
class ScheduleTransferTool extends StructuredTool {
  name = "schedule_transfer";
  description = "Schedule a recurring StoreCoin transfer to a principal. Parameters: amount (number), to (string), frequency (string)";

  async _call(input) {
    try {
      console.log("ScheduleTransferTool raw input:", input); // Debug log
        // Handle string input (parse JSON) or object input
      let params;
      if (typeof input === 'string') {
        try {
          params = JSON.parse(input);
        } catch (e) {
          return safeStringify({ error: "Invalid JSON input format" });
        }
      } else {
        params = input;
      }
      
      console.log("ScheduleTransferTool parsed params:", params); // Debug log
      
      const amount = Number(params.amount);
      const to = params.to;
      const frequency = params.frequency;
      
      if (isNaN(amount) || amount <= 0) {
        return safeStringify({ error: "Amount must be a positive number" });
      }
      
      if (!to) {
        return safeStringify({ error: "Principal 'to' is required" });
      }
      
      if (!frequency) {
        return safeStringify({ error: "Frequency is required" });
      }
      
      console.log("ScheduleTransferTool final values:", { amount, to, frequency }); // Debug log
      const principal = Principal.fromText(to);
      const units = BigInt(Math.floor(amount * 1e8));
      const freqSeconds = frequency.toLowerCase() === "week" ? 604800 : 86400; // Week or day
      const result = await ai_agent_icp_backend.create_token_transfer_task(
        { owner: principal, subaccount: [] },
        units,
        []
      );
      return safeStringify({ success: true, taskId: Number(result) });
    } catch (err) {
      console.error("ScheduleTransferTool error:", err); // Debug log
      return safeStringify({ error: `Scheduling failed: ${err.message}` });
    }
  }
}

export const tools = [
  new MintTokensTool(),
  new TransferTokensTool(),
  new CheckBalanceTool(),
  new ScheduleTransferTool(),
];