import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Contact({ onSubmit }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    message: '',
  })
  const [error, setError] = useState('')

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value })
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    const submittedData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      contactNumber: formData.contactNumber.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
    }

    // The browser checks required fields and email format. Also reject spaces-only input.
    if (!submittedData.firstName || !submittedData.lastName ||
        !submittedData.contactNumber || !submittedData.email || !submittedData.message) {
      setError('Please fill in every field. Spaces alone are not enough.')
      return
    }

    // Keep the values in App state before leaving this page; nothing is sent to a server.
    onSubmit(submittedData)
    navigate('/')
  }

  return (
    <>
      <h1>Contact Me</h1>
      <div className="contact-layout">
        <section className="content-card contact-details">
          <h2>Contact Information</h2>
          <p>Anton Nasr</p>
          <p>Email: <a href="mailto:anton@example.com">anton@example.com</a></p>
          <p>Phone: (555) 010-2290</p>
          <p>These are fictional contact details for this portfolio demonstration.</p>
        </section>
        <section className="content-card">
          <h2>Leave a Message</h2>
          <p id="form-note">
            This is a student demonstration form. Your message will not be sent.
            All fields are required.
          </p>
          <form className="contact-form" onSubmit={handleSubmit} aria-describedby="form-note">
            <label htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" type="text" autoComplete="given-name"
              value={formData.firstName} onChange={handleChange} required />

            <label htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" type="text" autoComplete="family-name"
              value={formData.lastName} onChange={handleChange} required />

            <label htmlFor="contactNumber">Contact Number</label>
            <input id="contactNumber" name="contactNumber" type="tel" autoComplete="tel"
              value={formData.contactNumber} onChange={handleChange} required />

            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={formData.email} onChange={handleChange} required />

            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="6"
              value={formData.message} onChange={handleChange} required />

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button" type="submit">Submit</button>
          </form>
        </section>
      </div>
    </>
  )
}

export default Contact
