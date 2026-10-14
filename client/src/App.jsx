import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Projects from './pages/Projects.jsx'
import Education from './pages/Education.jsx'
import Services from './pages/Services.jsx'
import Contact from './pages/Contact.jsx'
import './App.css'

function App() {
  // Store the latest submission in memory only. Refreshing clears it.
  const [submittedContact, setSubmittedContact] = useState(null)

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home contactSubmitted={submittedContact !== null} />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/education" element={<Education />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact onSubmit={setSubmittedContact} />} />
      </Routes>
    </Layout>
  )
}

export default App
