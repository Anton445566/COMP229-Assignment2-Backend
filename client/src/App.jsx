import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Records from './pages/Records.jsx';
import RecordForm from './pages/RecordForm.jsx';
import Account from './pages/Account.jsx';
import { AuthProvider, Protected } from './Auth.jsx';
import './App.css';
export default function App() {
 return <AuthProvider><Layout><Routes>
 <Route path="/" element={<Home />} />
 <Route path="/about" element={<About />} />
 <Route path="/services" element={<Services />} />
 <Route path="/projects" element={<Records resource="projects" />} />
 <Route path="/education" element={<Records resource="qualifications" />} />
 <Route path="/contact" element={<Records resource="contacts" />} />
 <Route path="/signin" element={<Account key="signin" />} />
 <Route path="/signup" element={<Account key="signup" signup />} />
 <Route path="/admin/:resource/:id" element={<Protected admin><RecordForm /></Protected>} />
 <Route path="*" element={<p>Page not found.</p>} />
 </Routes></Layout></AuthProvider>;
}
