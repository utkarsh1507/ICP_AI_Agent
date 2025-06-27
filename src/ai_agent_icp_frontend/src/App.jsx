import { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { ai_agent_icp_backend } from '../../declarations/ai_agent_icp_backend';
import { robustAgent } from './utils/robustAgent';
import { hybridExecutor } from './utils/hybridCommandExecutor';
import TokenPanel from './components/TokenPanel';
import { testMintTokensDirect, testAllToolsDirect } from './testDirectTool.js';
import { executeSimpleCommand } from './simpleCommandParser.js';

function App() {
  const [tasks, setTasks] = useState([]);const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [command, setCommand] = useState('');
  const [commandResult, setCommandResult] = useState('');
  const [executionMethod, setExecutionMethod] = useState('hybrid'); // 'hybrid', 'ai', 'simple'
  const [agentStats, setAgentStats] = useState({});

  const [taskForm, setTaskForm] = useState({
    id: '',
    data: '',
    frequency: 60,
    actionType: 'custom'
  });
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        setLoading(true);
        console.log("Initializing robust agent...");
        
        const success = await robustAgent.initialize();
        if (success) {
          console.log("Agent initialized successfully");
        } else {
          console.log("Agent initialization failed, will use simple parser");
        }
        
        setAgentStats(hybridExecutor.getStats());
      } catch (err) {
        console.error("Agent setup error:", err);
        setError(`Agent setup failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeAgent();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ai_agent_icp_backend.get_tasks();
      setTasks(result);
    } catch (err) {
      setError(`Failed to fetch tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const searchTaskById = async () => {
    if (!searchId.trim()) {
      setError("Please enter a task ID to search");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const id = BigInt(searchId);
      const task = await ai_agent_icp_backend.get_task(id);
      if (!task.status || task.status.Ok === null) {
        setError(`No task found with ID: ${searchId}`);
        setTasks([]);
      } else {
        setTasks([task.status.Ok]);
        setSuccessMessage(`Found task with ID: ${searchId}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(`Failed to find task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskForm({ ...taskForm, [name]: type === 'checkbox' ? checked : value });
  };

  const createTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result;
      if (taskForm.actionType === "token_transfer") {
        let taskData = JSON.parse(taskForm.data);
        if (!taskData.to || !taskData.amount) {
          throw new Error("Task data must include 'to' and 'amount' fields");
        }
        const toPrincipal = Principal.fromText(taskData.to);
        const amount = BigInt(taskData.amount);
        const memo = taskData.memo ? new TextEncoder().encode(taskData.memo) : null;
        result = await ai_agent_icp_backend.create_token_transfer_task(
          { owner: toPrincipal, subaccount: [] },
          amount,
          memo ? [memo] : []
        );
      } else {
        result = await ai_agent_icp_backend.create_task(
          BigInt(taskForm.id || 0),
          taskForm.data,
          BigInt(taskForm.frequency),
          taskForm.actionType
        );
      }
      setSuccessMessage("Task created successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      setTaskForm({ id: "", data: "", frequency: 60, actionType: "custom" });
      await fetchTasks();
    } catch (err) {
      setError(`Failed to create task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      setError(null);
      await ai_agent_icp_backend.delete_task(BigInt(id));
      setSuccessMessage(`Task ${id} deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTasks();
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  const executeAllTasks = async () => {
    try {
      setError(null);
      await ai_agent_icp_backend.execute_tasks();
      setSuccessMessage("Tasks executed successfully!");
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTasks();
    } catch (err) {
      setError(`Failed to execute tasks: ${err.message}`);
    }
  };

  const resetView = () => {
    setSearchId('');
    fetchTasks();
  };  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) {
      setError("Please enter a command");
      return;
    }

    setLoading(true);
    setError(null);
    setCommandResult('');
    setSuccessMessage('');

    try {
      console.log(`Processing command with method: ${executionMethod}`);
      
      let result;
      
      if (executionMethod === 'hybrid') {
        result = await hybridExecutor.executeCommand(command);
      } else if (executionMethod === 'ai') {
        result = await hybridExecutor.executeCommand(command, 'ai');
      } else {
        result = await hybridExecutor.executeCommand(command, 'simple');
      }

      if (result.success) {
        setCommandResult(result.result);
        let message = `Command executed successfully!`;
        
        if (result.source) {
          message += ` (via ${result.source})`;
        }
        
        if (result.fallbackUsed) {
          message += ` Note: AI failed, used simple parser as fallback.`;
        }
        
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 5000);

        // Refresh tasks if command might have affected them
        if (command.toLowerCase().includes('schedule')) {
          await fetchTasks();
        }
      } else {
        setError(result.error);
        if (result.originalAIError) {
          console.log("Original AI error:", result.originalAIError);
        }
      }

      // Update stats
      setAgentStats(hybridExecutor.getStats());

    } catch (err) {
      console.error("Command execution error:", err);
      setError(`Command execution failed: ${err.message}`);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };


  const testDirectTools = async () => {
    setError(null);
    setCommandResult('');
    try {
      console.log("Testing tools directly (bypassing OpenAI)...");
      const result = await testMintTokensDirect();
      setCommandResult(`Direct tool test result: ${JSON.stringify(result, null, 2)}`);
      setSuccessMessage("Direct tool test completed!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Direct tool test failed: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <h1>ICP Agent Dashboard</h1>
      <div className="tabs">
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}>
          Task Manager
        </button>
        <button
          className={activeTab === 'tokens' ? 'active' : ''}
          onClick={() => setActiveTab('tokens')}>
          Token Management
        </button>
      </div>
      {activeTab === 'tasks' ? (
        <div className="tasks-panel">
          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}
          {commandResult && <div className="command-result">{commandResult}</div>}          <div className="command-form">
            <h2>AI Command Executor</h2>
            
            {/* Execution Method Selector */}
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <strong>Execution Method:</strong>
              <div style={{ marginTop: '5px' }}>
                <label style={{ marginRight: '15px' }}>
                  <input
                    type="radio"
                    value="hybrid"
                    checked={executionMethod === 'hybrid'}
                    onChange={(e) => setExecutionMethod(e.target.value)}
                    style={{ marginRight: '5px' }}
                  />
                  🚀 Hybrid (AI + Fallback) - Recommended
                </label>
                <label style={{ marginRight: '15px' }}>
                  <input
                    type="radio"
                    value="ai"
                    checked={executionMethod === 'ai'}
                    onChange={(e) => setExecutionMethod(e.target.value)}
                    style={{ marginRight: '5px' }}
                  />
                  🤖 LangChain AI Only
                </label>
                <label>
                  <input
                    type="radio"
                    value="simple"
                    checked={executionMethod === 'simple'}
                    onChange={(e) => setExecutionMethod(e.target.value)}
                    style={{ marginRight: '5px' }}
                  />
                  ⚡ Simple Parser Only
                </label>
              </div>
              
              {/* Agent Status */}
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
                <strong>Status:</strong> 
                {agentStats.agentReady ? ' 🟢 LangChain Agent Ready' : ' 🔴 LangChain Agent Not Ready'} | 
                AI Failures: {agentStats.consecutiveAIFailures || 0}/{agentStats.maxAIFailures || 3}
              </div>
            </div>
            
            <form onSubmit={handleCommand}>
              <input
                type="text"
                placeholder="e.g., mint 100 tokens or transfer 100 tokens to vcbh3-..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                required
              />
              <button type="submit" disabled={loading} style={{ marginTop: '10px', backgroundColor: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', width: '100%' }}>
                {loading ? "Processing..." : "Execute Command"}
              </button>
            </form>
            
            <div style={{ marginTop: '10px' }}>
              <button onClick={testDirectTools} disabled={loading} style={{ backgroundColor: '#007acc', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Test Tools Directly
              </button>
            </div>
            
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
              <strong>Supported Commands:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li><code>mint 100 tokens</code> - Mint tokens to default principal</li>
                <li><code>mint 100 tokens to &lt;principal&gt;</code> - Mint to specific principal</li>
                <li><code>transfer 50 tokens to &lt;principal&gt;</code> - Transfer tokens</li>
                <li><code>check balance of &lt;principal&gt;</code> - Check balance</li>
                <li><code>schedule 10 tokens to &lt;principal&gt; every week</code> - Schedule recurring transfer</li>
              </ul>
            </div>
          </div>
          <div className="task-form">
            <h2>Create New Task (Legacy)</h2>
            <form onSubmit={createTask}>
              <div>
                <label htmlFor="id">Task ID (0 for auto):</label>
                <input
                  type="number"
                  id="id"
                  name="id"
                  value={taskForm.id}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="data">Task Data (JSON):</label>
                <textarea
                  id="data"
                  name="data"
                  value={taskForm.data}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="frequency">Frequency (seconds):</label>
                <input
                  type="number"
                  id="frequency"
                  name="frequency"
                  value={taskForm.frequency}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="actionType">Action Type:</label>
                <select
                  id="actionType"
                  name="actionType"
                  value={taskForm.actionType}
                  onChange={handleChange}
                >
                  <option value="custom">Custom</option>
                  <option value="http_request">HTTP Request</option>
                  <option value="token_transfer">Token Transfer</option>
                </select>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </button>
            </form>
          </div>
          <div className="task-search">
            <h2>Search Task</h2>
            <div className="search-container">
              <input
                type="number"
                placeholder="Enter Task ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button onClick={searchTaskById}>Search</button>
              <button onClick={resetView}>Show All</button>
            </div>
          </div>
          <div className="task-list">
            <h2>Scheduled Tasks</h2>
            <button onClick={executeAllTasks} className="action-button" disabled={loading}>
              {loading ? "Executing..." : "Execute Due Tasks"}
            </button>
            <button onClick={fetchTasks} className="refresh-button">Refresh Task List</button>
            {loading ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p>No tasks scheduled yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Frequency</th>
                    <th>Last Run</th>
                    <th>Action Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id.toString()}>
                      <td>{task.id.toString()}</td>
                      <td className="data-cell">{task.data}</td>
                      <td>{task.frequency.toString()} sec</td>
                      <td>
                        {task.last_run.toString() === "0" ? "Never" : new Date(Number(task.last_run) * 1000).toLocaleString()}
                      </td>
                      <td>{task.action_type}</td>
                      <td>{task.enabled ? "Enabled" : "Disabled"}</td>
                      <td>
                        <button onClick={() => deleteTask(task.id.toString())} className="delete-button">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <TokenPanel />
      )}
    </div>
  );
}

export default App;