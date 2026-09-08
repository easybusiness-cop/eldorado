export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
}

export async function fetchGoogleTaskLists(token: string): Promise<GoogleTaskList[]> {
  try {
    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Tasks API error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.items || [];
  } catch (err: any) {
    console.error('Failed to fetch Google Task Lists:', err);
    throw err;
  }
}

export async function fetchGoogleTasks(token: string, tasklistId: string): Promise<GoogleTaskItem[]> {
  try {
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Tasks API error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.items || [];
  } catch (err: any) {
    console.error('Failed to fetch Google Tasks:', err);
    throw err;
  }
}

export async function createGoogleTask(
  token: string,
  tasklistId: string,
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTaskItem> {
  try {
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      throw new Error(`Failed to create task: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('Error creating Google Task:', err);
    throw err;
  }
}

export async function updateGoogleTask(
  token: string,
  tasklistId: string,
  taskId: string,
  updates: Partial<GoogleTaskItem>
): Promise<GoogleTaskItem> {
  try {
    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to update task: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('Error updating Google Task:', err);
    throw err;
  }
}

export async function deleteGoogleTask(token: string, tasklistId: string, taskId: string): Promise<void> {
  try {
    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to delete task: ${res.statusText}`);
    }
  } catch (err: any) {
    console.error('Error deleting Google Task:', err);
    throw err;
  }
}
