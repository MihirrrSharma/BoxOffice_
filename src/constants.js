import axios from "axios";

export const fetchMovies = async (query = "") => {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies?q=${query}`);
  return res.data;
};

export const fetchMovieDetail = async (id) => {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movie/${id}`);
  return res.data;
};