import { tokenCanister } from "./server.js";
import { Principal } from "@dfinity/principal";
export async function sendPrompt(prompt: string, owner: Principal, id: bigint) {
  try {
    console.log("📨 Sending prompt:", prompt, "Owner:", owner.toText());

    const response = await fetch("http://localhost:5000/api/prompt", {
      body: JSON.stringify({ prompt, owner: owner.toText() }),
      method: "POST",
      headers: { "Content-Type": "application/json" },  
    });

    if (!response.ok) {
      console.error("❌ Failed to send prompt:", response.statusText);
      return;
    }

    const output = await response.json();
    console.log("🤖 Output from AI:", output);

    const result = await tokenCanister?.store_output(
      JSON.stringify(output, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
      id
    );

    if (result) {
      console.log("✅ Output stored for agent", id.toString());
    }
  } catch (error) {
    console.error("❌ Error in sendPrompt:", error);
  }
}
