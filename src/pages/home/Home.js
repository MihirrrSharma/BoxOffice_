import React, { useEffect, useState } from "react";
import "./Home.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { Link } from "react-router-dom";
import MovieList from "../../components/movielist/movieList";
import { fetchMovies } from "../../constants";
import ForYou from "../../components/forYou/ForYou";

const Home = () => {
  const [popularMovies, setPopularMovies] = useState([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetchMovies("Mission Impossible"); // fallback for trending movies

        const movies =
          response.source === "tmdb"
            ? response.data.map((m) => ({
                id: m.id,
                title: m.title,
                poster: m.Poster !== "N/A" ? m.Poster : "https://dummyimage.com/300x450/000/fff&text=No+Image"
              }))
            : response.data.map((m) => ({
                id: m.imdbID,
                title: m.Title,
                poster: m.Poster !== "N/A" ? m.Poster : "https://dummyimage.com/300x450/000/fff&text=No+Image"
              }));

        setPopularMovies(movies);
      } catch (error) {
        console.error("Error fetching popular movies:", error);
      }
    };

    getData();
  }, []);

  return (
    <div className="poster">
      <Carousel autoPlay infiniteLoop showThumbs={false}>
        {popularMovies.map((movie) => (
          <Link key={movie.id} to={`/movie/${movie.id}`}>
            <div className="posterImage">
              <img
              src={movie.poster}
              alt={movie.title}
            />
            </div>
            <div className="posterImage__overlay">
              <div className="posterImage__title">{movie.title}</div>
            </div>
          </Link>
        ))}
      </Carousel>

      <ForYou />
      <MovieList />
    </div>
  );
};

export default Home;