import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../Auth.jsx'

function Layout({ children }) {
  const { user, signout } = useAuth()
  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <div className="site-brand">
            <Link className="logo" to="/" aria-label="Anton Nasr - Home">
              AN
            </Link>
            <span>Anton Nasr<small>Student Portfolio</small></span>
          </div>
          <nav className="site-nav" aria-label="Main navigation">
            {/* end keeps Home from appearing active on every route. */}
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About Me</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/education">Education</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/contact">Contact Me</NavLink>
            {user ? <><span>{user.role}</span><button className="button" onClick={signout}>Sign out</button></> : <><NavLink to="/signin">Signin</NavLink><NavLink to="/signup">Signup</NavLink></>}
          </nav>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="site-footer">Anton Nasr · COMP229 Portfolio</footer>
    </>
  )
}

export default Layout
