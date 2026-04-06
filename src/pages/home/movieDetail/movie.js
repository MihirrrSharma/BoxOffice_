import React, { useEffect, useState } from "react";
import "./movie.css";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail } from "../../../constants";

const Movie = () => {
  const [movie, setMovie] = useState(null);
  const [source, setSource] = useState("");
  const { id } = useParams();

  const { data: movieResponse } = useQuery({
    queryKey: ["movieDetail", id],
    queryFn: () => fetchMovieDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutes for movie detail
  });

  useEffect(() => {
    if (!movieResponse) return;

    setMovie(movieResponse.data);
    setSource(movieResponse.source);

    const title =
      movieResponse.source === "tmdb"
        ? movieResponse.data.original_title
        : movieResponse.data.Title;

    document.title = `${title} | BoxOffice`;
    window.scrollTo(0, 0);

    return () => {
      document.title = "🎬 BoxOffice";
    };
  }, [id, movieResponse]);

  if (!movie) {
    return (
      <div className="movie__loading">
        <div className="loader"></div>
      </div>
    );
  }

  // 🔥 Normalize data
  const data =
    source === "tmdb"
      ? {
          title: movie.original_title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          backdrop: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            : null,
          rating: movie.vote_average,
          overview: movie.overview,
          release: movie.release_date,
          genres: movie.genres?.map((g) => g.name).join(", "),
          runtime: movie.runtime ? `${movie.runtime} mins` : null,
          trailerKey: movie.trailerKey,
        }
      : {
          title: movie.Title,
          poster: movie.Poster,
          backdrop: null, // ✅ no duplicate
          rating: movie.imdbRating,
          overview: movie.Plot,
          release: movie.Released,
          genres: movie.Genre,
          runtime: movie.Runtime,
          actors: movie.Actors,
          awards: movie.Awards,
          boxOffice: movie.BoxOffice,
        };

  return (<>
    <div className="movie">
      {/* 🔥 HERO SECTION */}
      <div className="movie__hero">
        {data.trailerKey ? (
          <iframe
            className="movie__video"
            src={`https://www.youtube.com/embed/${data.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${data.trailerKey}`}
            title="trailer"
            allow="autoplay; encrypted-media"
          />
        ) : (
          <img src={data.backdrop || data.poster} alt="" />
        )}
        <div className="movie__overlay" />
      </div>

      {/* 🔥 CONTENT */}
      <div className="movie__content">
        {/* LEFT */}
        <div className="movie__left">
          <img className="movie__poster" src={data.poster} alt={data.title} />
        </div>

        {/* RIGHT */}
        <div className="movie__right">
          <h1 className="movie__title">{data.title}</h1>

          <div className="movie__meta">
            <span>⭐ {data.rating || "N/A"}</span>
            <span>{data.release}</span>
            {data.runtime && <span>{data.runtime}</span>}
          </div>

          {data.genres && (
            <div className="movie__genres">🎭 {data.genres}</div>
          )}

          {data.actors && (
            <div className="movie__actors">🎬 {data.actors}</div>
          )}

          {data.awards && (
            <div className="movie__awards">🏆 {data.awards}</div>
          )}

          {data.boxOffice && (
            <div className="movie__box">
              💰 Box Office: {data.boxOffice}
            </div>
          )}

          <div className="movie__sectionTitle">Overview</div>
          <p className="movie__desc">{data.overview}</p>
        </div>
      </div>
    </div>
  </>
    
  );
};

export default Movie;