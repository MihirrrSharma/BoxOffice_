import axios from "axios";
import { getUserId } from "./utils/user";

export const fetchMovies = async (query = "") => {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies?q=${query}`);
  return res.data;
};

export const fetchMovieDetail = async (id) => {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movie/${id}`);
  return res.data;
};

export const fetchAIResponse = async (message, context = {}) => {
  const res = await axios.post(
    `${process.env.REACT_APP_API_URL}/api/ai/chat`,
    { message, ...context }
  );
  return res.data;
};

export const trackUserActivity = async ({ movie, search }) => {
  try {
    const payload = {
      userId: getUserId(),
      ...(movie && { movie }),
      ...(search && { search }),
    };

    await axios.post(
      `${process.env.REACT_APP_API_URL}/api/user/activity`,
      payload
    );
  } catch (err) {
    console.log("Tracking failed", err);
  }
};

export const fetchRecommendations = async (userId) => {
  const res = await axios.get(
    `${process.env.REACT_APP_API_URL}/api/user/recommendations/${userId}`
  );
  return res.data;
};