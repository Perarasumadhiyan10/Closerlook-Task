import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bus, Menu, X, UserRound, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [open,setOpen]=useState(false); const {user,signOut}=useAuth(); const navigate=useNavigate()
  const logout=async()=>{await signOut();navigate('/')}
  return <header className="navbar"><div className="nav-inner">
    <Link className="brand" to="/"><span className="brand-mark"><Bus size={23}/></span>BUSGO</Link>
    <button className="menu-btn" onClick={()=>setOpen(!open)} aria-label="Menu">{open?<X/>:<Menu/>}</button>
    <nav className={open?'nav-links open':'nav-links'}>
      <NavLink to="/" onClick={()=>setOpen(false)}>Home</NavLink>
      <NavLink to="/bookings" onClick={()=>setOpen(false)}>My Bookings</NavLink>
      {user ? <div className="user-menu"><span><UserRound size={17}/>{user.name}</span><button onClick={logout}><LogOut size={16}/>Logout</button></div> : <Link className="nav-login" to="/login">Login / Signup</Link>}
    </nav>
  </div></header>
}

