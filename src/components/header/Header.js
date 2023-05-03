import React from "react";  
import "./Header.css"
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="header">
        <div className="headerLeft">
          <Link to="/"><img className="header__icon" src="https://m.media-amazon.com/images/G/01/IMDb/BG_rectangle._CB1509060989_SY230_SX307_AL_.png" alt="IMDB_Logo" /></Link>
          <Link to="/movies/popular"  style={{textDecoration: "none"}}><span>Popular</span></Link>
          <Link to="/movies/top_rated" style={{textDecoration: "none"}}><span>Top Rated</span></Link>
          <Link to="/movies/upcoming" style={{textDecoration: "none"}}><span>Upcoming</span></Link>
        </div>
    </div>
  )
}

export default Header;