import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { trackUserActivity } from "../../constants";


const Header = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const selectionRef = useRef(false);
  const navTimerRef = useRef(null);
  const selectionFreezeRef = useRef(null);
  const { isLight, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const wrapperRef = useRef(null);

  // debounce API query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = query.trim();
      setDebouncedQuery(trimmed);

      // track search activity (with debounce + trim)
      if (trimmed.length > 2) {
        trackUserActivity({ search: trimmed });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  // scroll shrink
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // fetch search suggestions with React Query
  const { data: searchResults = [] } = useQuery({
    queryKey: ["movieList", debouncedQuery], // ✅ changed
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/movies?q=${debouncedQuery}`
      );
      return res.data.data.slice(0, 6);
    },
    enabled: !!debouncedQuery,
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

  // fetch trending with React Query
  const { data: trendingMovies = [] } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/movies?type=popular`
      );
      return res.data.data.slice(0, 6);
    },
    staleTime: 1000 * 60 * 15, // 10-15 minutes for trending
  });

  const prefetchMovieList = (type) => {
    queryClient.prefetchQuery(
      ["movieList", type],
      async () => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies?type=${type}`);
        return res.data;
      },
      {
        staleTime: 1000 * 60 * 12,
      }
    );
  };

  // close outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogoClick = () => {
    setQuery("");
    setShowDropdown(false);
  };

  const handleSelectMovie = (movieId) => {
    selectionRef.current = true;
    clearTimeout(navTimerRef.current);
    clearTimeout(selectionFreezeRef.current);
    setQuery("");
    setShowDropdown(false);
    navigate(`/movie/${movieId}`);
    selectionFreezeRef.current = window.setTimeout(() => {
      selectionRef.current = false;
    }, 1000);
  };

  return (
      <div className={`header ${scrolled ? "header--small" : ""}`}>

      {/* LEFT */}
      <div className="headerLeft">
      <Link to="/" className="logo" onClick={handleLogoClick}>
        <span className="logoBox">
          Box<span className="logoAccent">Office</span>
        </span>
      </Link>

      <NavLink
        to="/movies/popular"
        className="navItem"
        onMouseEnter={() => prefetchMovieList("popular")}
      >
        <span>Popular</span>
      </NavLink>
      <NavLink
        to="/movies/top_rated"
        className="navItem"
        onMouseEnter={() => prefetchMovieList("top_rated")}
      >
        <span>Top Rated</span>
      </NavLink>
      <NavLink
        to="/movies/upcoming"
        className="navItem"
        onMouseEnter={() => prefetchMovieList("upcoming")}
      >
        <span>Upcoming</span>
      </NavLink>

      {/* 🔥 MOVE TOGGLE HERE */}
      <div className="themeToggle">
        <input
          type="checkbox"
          id="themeToggle"
          checked={isLight}
          onChange={toggleTheme}
        />
        <label htmlFor="themeToggle" className="toggleLabel">
          <span className="sun">☀️</span>
          <span className="moon">🌙</span>
          <div className="ball"></div>
        </label>
      </div>

      <button
        type="button"
        className="mobileMenuButton"
        onClick={toggleMenu}
        aria-label="Open menu"
      >
        <span />
        <span />
        <span />
      </button>
    </div>

      {/* CENTER SEARCH */}
      <div className="headerRight">
        <div className="searchWrapper" ref={wrapperRef}>
          <div className="searchBox">
            <span className="searchIcon">🔍</span>

            <input
              type="text"
              placeholder="Search movies..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 🚫 block navigation
                }
              }}
            />

            {query && (
              <span
                className="clearIcon"
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                }}
              >
                ✖
              </span>
            )}
          </div>

          {showDropdown &&
            (query || trendingMovies.length > 0) && (
              <div className="searchDropdown">
                {query && searchResults.length === 0 && (
                  <div className="noResults">No results found</div>
                )}

                {!query && <p className="dropdownTitle">🔥 Trending</p>}

                {(query ? searchResults : trendingMovies).map((m) => {
                  const movieId = m.id || m.imdbID;
                  return (
                    <div
                      key={movieId}
                      className="searchItem"
                      onMouseDown={() => {
                        selectionRef.current = true;
                        clearTimeout(navTimerRef.current);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMovie(movieId);
                      }}
                    >
                      <img
                        src={
                          m.poster_path
                            ? `https://image.tmdb.org/t/p/w200${m.poster_path}`
                            : m.Poster
                        }
                        alt=""
                      />
                      <span>{m.title || m.Title}</span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <div
        className={`mobileMenuOverlay ${menuOpen ? "mobileMenuOverlay--visible" : ""}`}
        onClick={closeMenu}
      />

      <aside className={`mobileMenu ${menuOpen ? "mobileMenu--open" : ""}`}>
        <button
          type="button"
          className="mobileMenuClose"
          onClick={closeMenu}
          aria-label="Close menu"
        >
          ✕
        </button>
        <nav className="mobileMenuNav">
          <NavLink to="/movies/popular" onClick={closeMenu} onMouseEnter={() => prefetchMovieList("popular")}> 
            Popular
          </NavLink>
          <NavLink to="/movies/top_rated" onClick={closeMenu} onMouseEnter={() => prefetchMovieList("top_rated")}> 
            Top Rated
          </NavLink>
          <NavLink to="/movies/upcoming" onClick={closeMenu} onMouseEnter={() => prefetchMovieList("upcoming")}> 
            Upcoming
          </NavLink>
        </nav>
      </aside>
      </div>
  );
};

export default Header;