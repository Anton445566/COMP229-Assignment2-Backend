import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../Auth';
import { resources } from '../records';
import plant from '../assets/growing-planet.svg';
import database from '../assets/database.svg';
import portfolio from '../assets/portfolio.svg';
const images = { 'Growing Planet': plant, 'Database / SQL Coursework': database, 'React Portfolio': portfolio };
export default function Records({ resource }) {
 const config = resources[resource];
 const { user, token, loading: authLoading } = useAuth();
 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [busy, setBusy] = useState('');
 const [revision, setRevision] = useState(0);
 useEffect(() => {
  let active = true;
  setLoading(true); setError(''); setItems([]);
  if (resource === 'contacts' && !user) { setLoading(false); return; }
  api('/api/' + resource, { token }).then(data => { if (active) setItems(data); })
   .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [resource, token, user, revision]);
 async function remove(item) {
  if (!window.confirm('Delete ' + (item.title || item.firstname + ' ' + item.lastname) + '? This cannot be undone.')) return;
  setBusy(item._id); setError(''); setSuccess('');
  try {
   await api('/api/' + resource + '/' + item._id, { token, method: 'DELETE' });
   setItems(current => current.filter(record => record._id !== item._id)); setSuccess(config.singular + ' deleted.');
  } catch (err) { setError(err.message); } finally { setBusy(''); }
 }
 return <><h1>{config.title}</h1>
 {resource === 'projects' && <p className="page-intro">My coursework in plant care, databases, and web development.</p>}
 {resource === 'contacts' && <section className="content-card"><h2>Contact Information</h2><p>Anton Nasr · <a href="mailto:anton@example.com">anton@example.com</a> · (555) 010-2290</p><p>These are fictional details for this portfolio demonstration. Contact records are available to signed-in users. Only admins may submit or change them.</p></section>}
 {user && <p>Signed in as {user.name} ({user.role}). {user.role !== 'Admin' && 'You have read-only access to portfolio records.'}</p>}
 {user?.role === 'Admin' && <Link className="button" to={'/admin/' + resource + '/new'}>Add {config.singular}</Link>}
 {!user && resource === 'contacts' && !authLoading && <p><Link to="/signin">Sign in</Link> to view contacts.</p>}
 {(loading || authLoading) && <p role="status">Loading records…</p>}
 {error && <div role="alert" className="form-error">{error} <button onClick={() => setRevision(value => value + 1)}>Retry</button></div>}
 {success && <p role="status" className="success-message">{success}</p>}
 {!loading && !error && (resource !== 'contacts' || user) && items.length === 0 && <p>No records yet.</p>}
 <div className={resource === 'projects' ? 'project-grid' : 'education-grid'}>{items.map(item => <article className="content-card" key={item._id}>
 <h2>{item.title || item.firstname + ' ' + item.lastname}</h2>
 {resource === 'projects' && images[item.title] && <img className="project-image" src={images[item.title]} alt={item.title + ' illustration'} />}
 {config.fields.filter(([key]) => key !== 'title').map(([key,label]) => item[key] && <p className="record-text" key={key}><strong>{label}:</strong> {key === 'completion' ? item[key].slice(0,10) : item[key]}</p>)}
 {user?.role === 'Admin' && <div className="page-links"><Link className="button button-secondary" to={'/admin/' + resource + '/' + item._id}>Edit</Link>
 <button className="button" disabled={Boolean(busy)} onClick={() => remove(item)}>{busy === item._id ? 'Deleting…' : 'Delete'}</button></div>}
 </article>)}</div></>;
}
