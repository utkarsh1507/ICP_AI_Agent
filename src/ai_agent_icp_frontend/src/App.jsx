import { useState, useEffect } from 'react';
import { ai_agent_icp_backend } from '../../declarations/ai_agent_icp_backend';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [taskForm, setTaskForm] = useState({
    id: '',
    data: '',
    frequency: 60,
    actionType: 'custom'
  });

  // Load tasks on component mount
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

      if (task === null || task === undefined) {
        setError(`No task found with ID: ${searchId}`);
        setTasks([]);
      } else {
        setTasks([task]);
        setSuccessMessage(`Found task with ID: ${searchId}`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(`Failed to find task: ${err.message}`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      const id = BigInt(taskForm.id);
      const frequency = BigInt(taskForm.frequency);

      console.log("Creating task with params:", {
        id: id.toString(),
        data: taskForm.data,
        frequency: frequency.toString(),
        actionType: taskForm.actionType
      });

      // Simplify the call - remove the url parameter completely
      await ai_agent_icp_backend.create_task_complete(
        id,
        taskForm.data,
        frequency,
        [], // empty array for opt
        taskForm.actionType
      );

      // Reset form & refresh task list
      setTaskForm({
        id: '',
        data: '',
        frequency: 60,
        actionType: 'custom'
      });

      setSuccessMessage("Task created successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

      fetchTasks();
    } catch (err) {
      setError(`Failed to create task: ${err.message}`);
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      setError(null);
      await ai_agent_icp_backend.delete_task(BigInt(id));
      setSuccessMessage(`Task ${id} deleted successfully!`);
      // Clear success message after 3 seconds
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
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTasks(); // Refresh to see updated last_run times
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
      <h1>ICP Agent Task Manager</h1>

      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <div className="task-form">
        <h2>Create New Task</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="id">Task ID:</label>
            <input
              type="number"
              id="id"
              name="id"
              value={taskForm.id}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="data">Task Data (JSON/Text):</label>
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
            </select>
          </div>

          <button type="submit">Create Task</button>
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
        <button onClick={executeAllTasks} className="action-button">Execute Due Tasks</button>
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
              {tasks.map((task) => (
                <tr key={task.id.toString()}>
                  <td>{task.id.toString()}</td>
                  <td>{task.data}</td>
                  <td>{task.frequency.toString()} sec</td>
                  <td>{task.last_run.toString() > 0
                    ? new Date(Number(task.last_run) * 1000).toLocaleString()
                    : 'Never'}
                  </td>
                  <td>{task.action_type}</td>
                  <td>{task.enabled ? 'Enabled' : 'Disabled'}</td>
                  <td>
                    <button onClick={() => deleteTask(task.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
