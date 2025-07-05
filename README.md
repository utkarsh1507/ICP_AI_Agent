# ICP Tokens Using AI Agent - MCP (Model Context Protocol)

This project showcases an AI-autonomous system for the creation, configuration, and deployment of ICRC-compliant tokens on the Internet Computer (ICP). Leveraging the Model Context Protocol (MCP), the platform integrates a local or cloud-hosted AI agent (such as Claude, GPT, or Mistral) that autonomously handles token logic generation, ledger initialization, and metadata configuration.

Users can interact with the system using natural language (e.g., "Create a token called AICoin with 8 decimals and a max supply of 1M"), and the MCP server handles these requests by invoking backend logic that:

- Validates token specifications,

- Generates or updates the ICRC ledger canister (using Rust and ic-cdk),

- Deploys the canister on ICP via dfx,

- Optionally returns a frontend integration snippet for use in dApps.

This approach decentralizes and automates the token lifecycle, enabling non-technical users or other agents to mint or manage ICP-native tokens purely through AI instructions.

 