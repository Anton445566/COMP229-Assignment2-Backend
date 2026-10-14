import { Link } from 'react-router-dom'

function Home({ contactSubmitted }) {
  return (
    <>
      {contactSubmitted && (
        <p className="success-message" role="status">
          Thank you for trying the contact form. Your information was captured
          for this demo; no message was sent.
        </p>
      )}
      <section className="home-intro">
        <p className="eyebrow">Learning, building, and growing</p>
        <h1>Hi, I'm Anton Nasr</h1>
        <p className="intro-text">
          Welcome to my portfolio. I'm a Software Engineering Technology student
          at Centennial College, developing my skills in databases, web development,
          and software development.
        </p>
        <p>
          This is a place to share my coursework, projects, and what I'm learning
          along the way.
        </p>
        <div className="page-links">
          <Link className="button" to="/about">About Me</Link>
          <Link className="button button-secondary" to="/projects">View My Projects</Link>
        </div>
      </section>
      <section className="content-card mission-card">
        <h2>My Mission</h2>
        <p>
          My goal is to keep learning through practice, build useful projects,
          and better understand how software and database systems work.
        </p>
      </section>
    </>
  )
}

export default Home
