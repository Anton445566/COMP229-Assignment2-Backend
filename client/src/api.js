export async function api(path, { token, body, method = 'GET' } = {}) {
 let response;
 try {
  response = await fetch(path, { method, headers: {
   ...(token ? { Authorization: 'Bearer ' + token } : {}),
   ...(body ? { 'Content-Type': 'application/json' } : {})
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
 } catch { throw new Error('Cannot reach the API. Check that the backend is running.'); }
 const data = await response.json().catch(() => ({}));
 if (response.status === 401 && token) window.dispatchEvent(new Event('auth-expired'));
 if (!response.ok) throw new Error(data.error || data.message || 'Request failed (' + response.status + ')');
 return data;
}
