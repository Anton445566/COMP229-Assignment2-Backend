function Services() {
  return (
    <>
      <h1>Services</h1>
      <p className="page-intro">
        As a student, I can help with small tasks related to what I'm learning.
        These are areas where I am continuing to develop my skills.
      </p>
      <div className="services-grid">
        <section className="content-card">
          <h2>Basic Web Development</h2>
          <p>
            Building simple pages with HTML, CSS, and JavaScript, and practising
            React components and navigation for small websites.
          </p>
        </section>
        <section className="content-card">
          <h2>Database / SQL Support</h2>
          <p>
            Helping with basic table design, SQL queries, and organising or
            retrieving data in coursework-sized projects.
          </p>
        </section>
        <section className="content-card">
          <h2>General Programming</h2>
          <p>
            Working on small programming exercises and helping identify basic
            code errors using concepts I have learned in class.
          </p>
        </section>
        <section className="content-card">
          <h2>PC Hardware / Technical Support</h2>
          <p>
            Helping with basic computer setup and everyday troubleshooting,
            while recognising when a problem needs more experienced support.
          </p>
        </section>
      </div>
    </>
  )
}

export default Services
