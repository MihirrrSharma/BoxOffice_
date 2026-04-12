import { useQuery } from "@tanstack/react-query";
import { fetchRecommendations } from "../../constants";
import { getUserId } from "../../utils/user";
import Cards from "../card/Card";

const ForYou = () => {
  const userId = getUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["forYou", userId],
    queryFn: () => fetchRecommendations(userId),
    enabled: !!userId,
  });

  const movies = data?.data || [];

  return (
    <div className="movie__list">
      <h2 className="list__title">🔥 For You</h2>

      <div className="list__cards">
        {isLoading
          ? "Loading..."
          : movies.map((movie) => (
              <Cards
                key={movie.id || movie.imdbID}
                movie={{
                  id: movie.id || movie.imdbID,
                  title: movie.title || movie.Title,
                  poster:
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                      : movie.Poster,
                }}
              />
            ))}
      </div>
    </div>
  );
};

export default ForYou;