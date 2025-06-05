import { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { ai_agent_icp_backend } from '../../declarations/ai_agent_icp_backend';
import TokenPanel from './components/TokenPanel';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  const [taskForm, setTaskForm] = useState({
    id: '',
    data: '',
    frequency: 60,
    actionType: 'custom'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ai_agent_icp_backend.get_tasks();
      console.log("Tasks fetched:", result);
      setTasks(result);
    } catch (err) {
      setError(`Failed to fetch tasks: ${err.message}`);
      console.error(err);
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
      console.log("Task search result:", task);

      if (!task.status || task.status.Ok === null) {
        setError(`No task found with ID: ${searchId}`);
        setTasks([]);
      } else {
        setTasks([task.status.Ok]);
        setSuccessMessage(`Found task with ID: ${searchId}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(`Failed to find task: ${err.message || err}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskForm({
      ...taskForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const createTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result;
      if (taskForm.actionType === "token_transfer") {
        let taskData;
        try {
          taskData = JSON.parse(taskForm.data);
        } catch (jsonErr) {
          throw new Error(`Invalid JSON in task data: ${jsonErr.message}`);
        }
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
      setError(`Failed to create task: ${err.message || err}`);
      console.error(err);
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
      console.error(err);
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
      console.error(err);
    }
  };

  const resetView = () => {
    setSearchId('');
    fetchTasks();
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
          <div className="task-form">
            <h2>Create New Task</h2>
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