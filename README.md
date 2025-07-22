# 🧬 Mintfinity.AI — Autonomous Token Agents on the ICP Blockchain

![Mintfinity.AI Logo](mintfinity-logo.png)

🌐 *"Speak it. Mint it. Automate it."*

---

Mintfinity.AI is an AI-powered framework that allows users to perform on-chain actions on the Internet Computer (ICP) blockchain using natural language. With powerful LLM integration, users can create, mint, burn, and transfer custom **ICRC tokens** just by typing simple prompts — no smart contract coding needed.

---

## 🌌 Vision  
1. **Natural Interaction with Blockchain**  
   Enable users to interact with the ICP blockchain using simple, human language.  
   No need for complex smart contract code or blockchain knowledge.

2. **Autonomous On-Chain Agents**  
   Empower AI agents to perform secure, on-chain actions like minting, burning, and transferring tokens.  
   These agents follow a defined lifecycle: initialize → execute → retire.

3. **Accessible Web3 Infrastructure**  
   Lower the entry barrier for creators, builders, and innovators.  
   Make decentralized token deployment and management effortless.

4. **Fusion of AI and Blockchain**  
   Bridge powerful language models with secure, scalable smart contracts on ICP.  
   Lead the future of intelligent Web3 automation.

---

## 🔍 Key Problems Addressed  
1. **Technical Barriers to Token Creation**  
   Requires smart contract expertise  
   Steep learning curve for non-developers  
   Manual deployment prone to errors

2. **Lack of Intelligent Interfaces**  
   Traditional UIs are rigid and limited  
   No natural language support  
   Difficult to automate token workflows

3. **Inefficient On-Chain Task Management**  
   No standard agent lifecycle or scheduling  
   Repetitive manual operations  
   Lack of autonomy in token management

4. **Limited Access to Web3 Tools**  
   Creators and startups without dev teams are left behind  
   No-code tools lack flexibility  
   Most platforms don’t support ICRC standards natively

---

## 🛠️ Key Features

🪄 **Natural Language Interface**  
Trigger token actions like mint, burn, and transfer using AI prompts.

📦 **Custom ICRC Token Creation**  
Deploy fully customizable ICRC tokens on ICP with zero boilerplate.

🔗 **On-Chain Canister Integration**  
All actions are securely handled via Internet Computer canisters.

🧠 **LLM-Driven Autonomous Agents**  
Autonomous agents that act on natural language instructions and schedule actions.

📁 **Configurable via JSON or Web UI (coming soon)**  
Customize agent behavior through configurations or user-friendly interfaces.

---

## Project Structure
```bash
ICP_AI_Agent/
├── .dfx/                               # Internet Computer local cache and configs
├── deps/                               # External dependencies pulled in by the project
├── Langchain_Tools/                   # LangChain-based tools for interacting with the canister via AI
│   ├── dist/                           # Compiled JS output
│   ├── node_modules/                   # Node dependencies
│   └── src/                            # Source files for tool scripts
│       ├── create-token-canister.ts    # Script to deploy token canister on IC
│       ├── prompts.json                # JSON prompts used by the AI tools
│       ├── server.ts                   # Express server to expose LangChain tools
│       ├── test-tool.ts                # Script to test LangChain integration
│       └── token-canister.ts           # Client to interact with the deployed token canister
├── src/                               # Main dapp source (frontend + canister code)
│   ├── ai_agent_icp_backend/          # Rust backend for Internet Computer
│   │   ├── src/                        # Rust source files
│   │   │   ├── agent_core.rs           # Core agent logic for ICP interactions
│   │   │   ├── lib.rs                  # Main Rust lib entry
│   │   │   └── token2.rs                # Token logic (ICRC/ledger interactions)
│   │   │   
│   │   ├── Cargo.toml                  # Rust project config
│   │   ├── task.schema.json            # JSON schema for LangChain tasks
│   │   ├── token.did                   # Candid interface for the token canister
│   └── ai_agent_icp_frontend/         # React frontend of your dapp
│       ├── dist/                       # Built frontend files
│       ├── node_modules/               # Frontend dependencies
│       ├── public/                     # Static assets (e.g., icons, logos)
│       └── src/                        # Source files for React frontend
│           ├── components/             # Reusable React components
│           │   └── hooks/              # Custom React hooks
│           │       └── useAuth.tsx     # Hook for handling auth (login/logout etc.)
│           ├── pages/                  # Main page layout
│           │   └── Landing/            # Landing page UI
│           │       ├── Features/       # Features section of the landing page
│           │       │   ├── index.css   # Styles for features section
│           │       │   └── index.tsx   # React code for features
│           │       ├── Footer/         # Footer component
│           │       ├── Hero/           # Hero banner section
│           ├── types/                  # TypeScript types/interfaces
│           ├── TokenPanel.jsx          # UI component for token interaction panel
│           ├── pages/                  # Additional page components
│           ├── utils/                  # Utility functions
│           │   └── sendPrompt.tsx      # Function to send prompt to LangChain backend
│           ├── App.jsx                 # Main App component
│           ├── index.css               # Global CSS
│           ├── index.html              # Entry HTML file
│           ├── index.scss              # SCSS styles (if used)
│           ├── main.jsx                # App entry point
│           ├── minimal_agent_test.js   # Minimal agent test logic
│           ├── Routes.tsx              # Route definitions for React app
│           └── vite-env.d.ts           # Vite/TypeScript types
├── .env                                # Global environment variables
├── .gitignore                          # Files/folders to ignore in git
├── Cargo.lock                          # Lock file for Rust dependencies
├── Cargo.toml                          # Rust workspace config
├── dfx.json                            # Internet Computer project config
├── package.json                        # Root JS/TS dependencies and scripts
├── package-lock.json                   # Lock file for root JS/TS project
├── tsconfig.json                       # TypeScript configuration
├── vite.config.js                      # Vite bundler config
└── README.md                           # Root project overview and setup instructions


```

## 🌱 Getting Started

To deploy this project locally:

### 1. Clone the Repository
```bash  
git clone https://github.com/utkarsh1507/ICP_AI_Agent.git
cd ICP_AI_Agent
```
### 2. Start the DFX Local Server
```bash
Copy
Edit
dfx start --background
cargo build
dfx build
```
### 3. Deploy the Canister
```bash
Copy
Edit
dfx deploy
```
### 4. Pull Internet Identity Canister
```bash
Copy
Edit
dfx deps pull
dfx deps deploy
```
### 5. Run the Frontend
```bash
Copy
Edit
npm run start
```