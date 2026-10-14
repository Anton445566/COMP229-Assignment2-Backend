function About() {
  return (
    <>
      <h1>About Me</h1>
      <div className="about-content">
        <section className="content-card about-intro">
          <p className="eyebrow">Software Engineering Technology Student</p>
          <h2>Anton Nasr</h2>
          <p>
            I am a Software Engineering Technology student at Centennial College
            with an interest in databases and web development. Through my program,
            I have worked with JavaScript, Python, C++, SQL, Linux, HTML/CSS, Git,
            and GitHub.
          </p>
          <p>
            I am continuing to build my programming skills and enjoy learning how
            software and database systems work. My projects give me opportunities
            to practise what I learn in class and work with others.
          </p>
        </section>
        <section className="content-card">
          <h2>Resume</h2>
          <a className="button" href="/anton-nasr-resume.pdf" target="_blank" rel="noreferrer">
            Open Resume PDF
          </a>
        </section>
      </div>
    </>
  )
}

export default About
