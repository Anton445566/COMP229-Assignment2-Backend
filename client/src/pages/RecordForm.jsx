import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../Auth';
import { resources, pagePath } from '../records';
export default function RecordForm() {
 const { resource, id } = useParams();
 const config = resources[resource];
 const { token } = useAuth();
 const [form, setForm] = useState({});
 const [loading, setLoading] = useState(id !== 'new');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [busy, setBusy] = useState(false);
 const [loadFailed, setLoadFailed] = useState(false);
 useEffect(() => {
  let active = true;
  setError(''); setSuccess(''); setForm({}); setLoadFailed(false); setLoading(id !== 'new');
  if (config && id !== 'new') api('/api/' + resource + '/' + id, { token }).then(data => {
   if (active) setForm({ ...data, completion: data.completion?.slice(0,10) || '' });
  }).catch(err => { if (active) { setError(err.message); setLoadFailed(true); } }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [resource, id, token, config]);
 if (!config) return <p role="alert">Unknown record type.</p>;
 async function submit(event) {
  event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
  try {
   const body = Object.fromEntries(config.fields.map(([key,,required]) => {
    const value = (form[key] || '').trim();
    if (required && !value) throw new Error('Please fill in every required field.');
    return [key, key === 'completion' && !value ? null : value];
   }));
   await api('/api/' + resource + (id === 'new' ? '' : '/' + id), { token, method: id === 'new' ? 'POST' : 'PUT', body });
   setSuccess(config.singular + ' saved in MongoDB. Return to the list to view it.');
   if (id === 'new') setForm({});
  } catch (err) { setError(err.message); } finally { setBusy(false); }
 }
 return <section className="content-card account-card"><h1>{id === 'new' ? 'Add' : 'Edit'} {config.singular}</h1>
 <p>Fields marked * are required.</p>
 {loading && <p role="status">Loading record…</p>}
 {error && <p className="form-error" role="alert">{error}</p>}
 {success && <p className="success-message" role="status">{success}</p>}
 {!loading && !loadFailed && <form className="contact-form" onSubmit={submit}>{config.fields.map(([key,label,required,type = 'text']) => <div className="field" key={key}>
 <label htmlFor={key}>{label}{required ? ' *' : ''}</label>
 {type === 'textarea' ? <textarea id={key} rows="5" maxLength={5000} required={required} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /> :
 <input id={key} type={type} required={required} maxLength={key === 'contactNumber' ? 30 : resource === 'contacts' && ['firstname', 'lastname'].includes(key) ? 100 : 200} pattern={type === 'tel' ? '[+()0-9 .-]{7,30}' : undefined} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
 </div>)}<button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></form>}
 <p><Link to={pagePath(resource)}>Back to {config.title}</Link></p></section>;
}
