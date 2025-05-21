# ICP Token MCP Server

This is a Model Context Protocol (MCP) server that exposes ICP token functionality to LLMs. It allows LLMs to interact with your token canister through standardized tools.

## Features

- Exposes token operations as MCP tools
- Integrates with your ICP token canister
- Provides fallback simulation for testing
- Follows MCP security best practices

## Available Tools

1. **token_get_balance** - Get the token balance for a specific account
2. **token_transfer** - Transfer tokens from one account to another
3. **token_get_metadata** - Get token metadata including name, symbol, and decimals
4. **token_get_transactions** - Get transaction history

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A running ICP token canister

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy `sample.env` to `.env` and update the values:

```bash
cp sample.env .env
```

4. Build the TypeScript code:

```bash
npm run build
```

## Usage

### Starting the Server

```bash
npm start
```

The server will start and listen for MCP client connections.

### Development Mode

```bash
npm run dev
```

## Integration with LLMs

This MCP server can be used with any MCP-compatible client, such as:

- Claude Desktop App
- Other MCP-compatible LLM interfaces

The LLM will be able to discover and use the tools exposed by this server to interact with your ICP token canister.

## Security Considerations

- The server implements proper input validation
- Error handling is designed to not expose sensitive information
- Fallback simulation is provided for testing without affecting real token balances

## License

MIT
