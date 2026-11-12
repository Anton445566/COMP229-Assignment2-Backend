import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api';
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
 const [session, setSession] = useState(null);
 const [loading, setLoading] = useState(true);
 const [notice, setNotice] = useState('');
 function clear(message = '') {
  sessionStorage.removeItem('portfolio-session');
  setSession(null); setNotice(message);
 }
 useEffect(() => {
  const expired = () => clear('Your session expired. Please sign in again.');
  window.addEventListener('auth-expired', expired);
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem('portfolio-session')); } catch { sessionStorage.removeItem('portfolio-session'); }
  if (saved?.token && saved?.user?._id) {
   api('/api/users/' + saved.user._id, { token: saved.token })
    .then(user => setSession({ token: saved.token, user }))
    .catch(error => clear(error.message)).finally(() => setLoading(false));
  } else setLoading(false);
  return () => window.removeEventListener('auth-expired', expired);
 }, []);
 useEffect(() => {
  if (!session) return;
  try {
   const expires = JSON.parse(atob(session.token.split('.')[1])).exp * 1000;
   const timer = setTimeout(() => clear('Your session expired. Please sign in again.'), Math.max(0, expires - Date.now()));
   return () => clearTimeout(timer);
  } catch { clear('Please sign in again.'); }
 }, [session]);
 async function signin(body) {
  const data = await api('/auth/signin', { method: 'POST', body });
  sessionStorage.setItem('portfolio-session', JSON.stringify(data));
  setSession(data); setNotice('');
 }
 async function signout() {
  try { await api('/auth/signout'); clear('You have signed out.'); }
  catch (error) { clear('Signed out locally. ' + error.message); }
 }
 return <Context.Provider value={{ user: session?.user, token: session?.token, loading, signin, signout }}>
  {notice && <p className="success-message" role="status">{notice}</p>}{children}
 </Context.Provider>;
}
export function Protected({ admin = false, children }) {
 const { user, loading } = useAuth();
 const location = useLocation();
 if (loading) return <p role="status">Checking session…</p>;
 if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
 if (admin && user.role !== 'Admin') return <p role="alert">Admin access required. Your account can view records only.</p>;
 return children;
}
