const API_URL = '/api';

async function loadUsers() {
  try {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = users.map(u => 
      `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td></tr>`
    ).join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    document.getElementById('healthStatus').textContent = 
      `Status: ${data.status} (${new Date(data.timestamp).toLocaleTimeString()})`;
  } catch (error) {
    document.getElementById('healthStatus').textContent = 'Status: Unhealthy';
  }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;

  try {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    if (res.ok) {
      document.getElementById('userForm').reset();
      loadUsers();
    }
  } catch (error) {
    console.error('Error adding user:', error);
  }
});

// Load data on page load
loadUsers();
checkHealth();
setInterval(checkHealth, 30000); // Check health every 30 seconds
