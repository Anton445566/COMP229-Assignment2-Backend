import growingPlanetImage from '../assets/growing-planet.svg'
import databaseImage from '../assets/database.svg'
import portfolioImage from '../assets/portfolio.svg'

function Projects() {
  return (
    <>
      <h1>Projects</h1>
      <p className="page-intro">
        These projects cover plant care, databases, and web development, and reflect
        what I am learning through coursework and teamwork.
      </p>
      <div className="project-grid">
        <article className="content-card">
          <h2>Growing Planet</h2>
          <img className="project-image" src={growingPlanetImage}
            alt="Illustration of a sprouting plant representing Growing Planet" width="640" height="360" />
          <p>
            A team software and web project based around helping users identify
            plant conditions and track plant needs. Feature ideas included checking
            plant condition, watering needs, and plant tracking.
          </p>
          <p><strong>My role:</strong> I contributed to the idea, feature discussions,
            project planning, and teamwork.</p>
          <p><strong>Outcome:</strong> I helped shape the project concept and planned
            features with my team.</p>
        </article>
        <article className="content-card">
          <h2>Database / SQL Coursework</h2>
          <img className="project-image" src={databaseImage}
            alt="Illustration of connected database tables representing SQL coursework" width="640" height="360" />
          <p>
            A general overview of my database coursework, covering relational
            database design, tables, and SQL queries for retrieving and managing data.
          </p>
          <p><strong>My role:</strong> Student practising database design and SQL
            through coursework.</p>
          <p><strong>Outcome:</strong> Practice in organising related data and
            understanding how SQL queries work with tables.</p>
        </article>
        <article className="content-card">
          <h2>React Portfolio</h2>
          <img className="project-image" src={portfolioImage}
            alt="Illustration of a browser window with code brackets representing this portfolio" width="640" height="360" />
          <p>
            My personal portfolio for COMP229, built using React, JavaScript,
            Vite, and CSS. React Router connects the six pages.
          </p>
          <p><strong>My role:</strong> Student developing the portfolio as a course
            assignment and learning to organise React components and routes.</p>
          <p><strong>Outcome:</strong> A working six-page structure with shared
            navigation, portfolio content, a demonstration contact form, and responsive
            styling.</p>
        </article>
      </div>
    </>
  )
}

export default Projects
