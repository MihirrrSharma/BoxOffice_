import React, { useEffect } from "react";
import "./movieList.css";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import Cards from "../card/Card";
import SkeletonCard from "../skeleton/SkeletonCard";
import { fetchMovies, trackUserActivity } from "../../constants";

const MovieList = () => {
  const { type } = useParams(); // ✅ correct place
  const location = useLocation();

  // 🔥 get search query properly
  const searchQuery = new URLSearchParams(location.search).get("q");
  
  useEffect(() => {
    if (type === "search" && searchQuery) {
      trackUserActivity({ search: searchQuery });
    }
  }, [searchQuery, type]);

  const category = type === "search" ? searchQuery : type || "popular";

  const { data: response, isLoading } = useQuery({
    queryKey: ["movieList", category],
    queryFn: async () => await fetchMovies(type === "search" ? searchQuery : type),
    enabled: type !== "search" ? true : !!searchQuery,
    staleTime: type === "search" ? 1000 * 60 * 2 : 1000 * 60 * 12,
    keepPreviousData: true,
  });

  const movieList = response
    ? response.source === "tmdb"
      ? response.data.map((m) => ({
          id: m.id,
          title: m.title,
          poster:
            m.Poster !== "N/A"
              ? m.Poster
              : "https://dummyimage.com/300x450/000/fff&text=No+Image",
          rating: m.vote_average,
        }))
      : response.data.map((m) => ({
          id: m.imdbID,
          title: m.Title,
          poster:
            m.Poster !== "N/A"
              ? m.Poster
              : "https://dummyimage.com/300x450/000/fff&text=No+Image",
          rating: m.imdbRating,
        }))
    : [];

  return (
    <div className="movie__list">
      <h2 className="list__title">
        {(type || "popular")
          .replace("_", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())}
      </h2>

      <div className="list__cards">
        {isLoading || movieList.length === 0
          ? Array(10).fill().map((_, i) => <SkeletonCard key={i} />)
          : movieList.map((movie) => (
              <Cards key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};

export default MovieList;