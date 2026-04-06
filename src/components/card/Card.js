import React, { useRef } from "react"; // ✅ FIX
import "./Card.css";
import { Link } from "react-router-dom";
import { fetchMovieDetail } from "../../constants";
import {
  getCachedMovie,
  setCachedMovie,
  getPendingRequest,
  setPendingRequest,
  clearPendingRequest
} from "../../utils/cache";

const Cards = ({ movie }) => {

  const hoverTimeout = useRef(null); // ✅ FIX

  const handleHover = () => {
    hoverTimeout.current = setTimeout(async () => {
      try {
        if (getCachedMovie(movie.id)) return;
        if (getPendingRequest(movie.id)) return;

        const promise = fetchMovieDetail(movie.id);
        setPendingRequest(movie.id, promise);

        const res = await promise;

        setCachedMovie(movie.id, res);
        clearPendingRequest(movie.id);

      } catch (e) {
        clearPendingRequest(movie.id);
        console.log("Prefetch error", e);
      }
    }, 300);
  };

  const handleLeave = () => {
    clearTimeout(hoverTimeout.current); // ✅ avoid unnecessary calls
  };

  return (
    <Link to={`/movie/${movie.id}`} className="cards__link">
      <div
        className="cards"
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave} // ✅ ADD THIS
      >
        <img
          className="cards__img"
          src={movie.poster}
          alt={movie.title}
          onError={(e) => {
            e.target.src = "https://dummyimage.com/300x450/000/fff&text=No+Image";
          }}
        />

        <div className="cards__overlay">
          <div className="card__title">{movie.title}</div>
        </div>
      </div>
    </Link>
  );
};

export default Cards;