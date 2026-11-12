import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../Auth';
export default function Account({ signup = false }) {
 const [form, setForm] = useState({ name: '', email: '', password: '' });
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const { signin } = useAuth();
 const navigate = useNavigate();
 const location = useLocation();
 async function submit(event) {
  event.preventDefault(); setError(''); setBusy(true);
  try {
   if (signup && !form.name.trim()) throw new Error('Name is required.');
   if (signup) {
    await api('/api/users', { method: 'POST', body: { ...form, name: form.name.trim(), email: form.email.trim() } });
    navigate('/signin', { state: { message: 'Account created. Sign in to continue.' } });
   } else {
    await signin({ email: form.email.trim(), password: form.password });
    navigate(location.state?.from || '/projects', { replace: true });
   }
  } catch (err) { setError(err.message); } finally { setBusy(false); }
 }
 return <section className="content-card account-card"><h1>{signup ? 'Signup' : 'Signin'}</h1>
 {location.state?.message && <p role="status" className="success-message">{location.state.message}</p>}
 <form className="contact-form" onSubmit={submit}>
 {signup && <><label htmlFor="name">Name</label><input id="name" autoComplete="name" required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></>}
 <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
 <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 6 : undefined} maxLength={1024} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
 {signup && <p>New accounts have the User role and can read records.</p>}
 {error && <p role="alert" className="form-error">{error}</p>}
 <button className="button" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button>
 </form><p><Link to={signup ? '/signin' : '/signup'}>{signup ? 'Already registered? Sign in' : 'Create an account'}</Link></p></section>;
}
