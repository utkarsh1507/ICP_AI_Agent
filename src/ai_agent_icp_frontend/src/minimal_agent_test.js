import { createActor } from "../../declarations/ai_agent_icp_backend";
import { ai_agent_icp_backend } from 'declarations/ai_agent_icp_backend';

let agent;

async function initAgent() {
  agent = createActor(process.env.CANISTER_ID_AI_AGENT_ICP_BACKEND);
}

async function createTask(id, data, frequency) {
  try {
    await agent.create_task(BigInt(id), data, BigInt(frequency));
    console.log(`Task created: ID ${id}, Data: ${data}, Frequency: ${frequency}`);
    await listTasks();
  } catch (error) {
    console.error("Error creating task:", error);
  }
}

async function listTasks() {
  try {
    const tasks = await agent.get_tasks();
    const list = document.getElementById("task-list");
    list.innerHTML = "";

    if (tasks.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No tasks found";
      list.appendChild(li);
      return;
    }

    tasks.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = `ID: ${t.id.toString()}, Data: ${t.data}, Frequency: ${t.frequency.toString()} seconds, Last Run: ${t.last_run.toString()}`;

      // Add delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.style.backgroundColor = "#f44336";
      deleteBtn.onclick = () => deleteTask(t.id);
      li.appendChild(deleteBtn);

      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error listing tasks:", error);
  }
}

async function deleteTask(id) {
  try {
    await agent.delete_task(id);
    console.log(`Task deleted: ID ${id}`);
    await listTasks();
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

async function getTaskById(id) {
  try {
    const task = await agent.get_task(BigInt(id));
    if (task) {
      console.log(`Task found: ID ${id}, Data: ${task.data}, Frequency: ${task.frequency.toString()} seconds, Last Run: ${task.last_run.toString()}`);
      // You can also display this task in the UI if needed
      const list = document.getElementById("task-list");
      list.innerHTML = "";  // Clear the existing list
      const li = document.createElement("li");
      li.textContent = `ID: ${task.id.toString()}, Data: ${task.data}, Frequency: ${task.frequency.toString()} seconds, Last Run: ${task.last_run.toString()}`;
      list.appendChild(li);
    } else {
      console.log(`Task with ID ${id} not found.`);
    }
  } catch (error) {
    console.error("Error fetching task:", error);
  }
}

// Initialize when document is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await initAgent();
  await listTasks();

  document.getElementById("create-task-btn").onclick = async () => {
    const id = document.getElementById("task-id").value;
    const data = document.getElementById("task-data").value;
    const freq = document.getElementById("task-freq").value;

    if (!id || !data || !freq) {
      alert("Please fill in all fields");
      return;
    }

    await createTask(id, data, freq);
  };

  document.getElementById("refresh-tasks-btn").onclick = listTasks;

  // Event listener for "Get Task" button
  document.getElementById("get-task-btn").onclick = async () => {
    const id = document.getElementById("task-id").value;
    if (!id) {
      alert("Please enter a task ID");
      return;
    }
    await getTaskById(id);
  };
});
