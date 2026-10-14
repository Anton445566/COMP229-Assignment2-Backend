function Education() {
  return (
    <>
      <h1>Education</h1>
      <div className="education-grid">
        <section className="content-card education-card">
          <h2>Centennial College</h2>
          <p><strong>Program:</strong> Software Engineering Technology</p>
          <p><strong>Started:</strong> September 2025</p>
          <p><strong>Current status:</strong> Student</p>
        </section>
        <section className="content-card education-card">
          <h2>St. Joan of Arc Catholic Secondary School</h2>
          <p>Mississauga, Ontario</p>
          <p><strong>Graduated:</strong> Approximately 2023</p>
        </section>
      </div>
      <section className="content-card">
        <h2>Professional Qualifications</h2>
        <ul>
          <li>Security Licence</li>
          <li>First Aid / CPR</li>
        </ul>
      </section>
    </>
  )
}

export default Education
