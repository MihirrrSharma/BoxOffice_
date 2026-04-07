import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://box-office-z18g-xr0j-8w54bituw-mihirrrsharmas-projects.vercel.app"
    ],
    credentials: true
  })
);

app.use(cors());

app.use(express.json());

const PORT = process.env.PORT || 5000;

const TMDB_BASE = "https://api.themoviedb.org/3";

// tmdb helper with auth and timeout
const tmdbRequest = async (url, params = {}) => {
  return axios.get(`${TMDB_BASE}${url}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
    },
    params,
    timeout: 3000,
  });
};

// omdb helper with auth and timeout
const omdbRequest = async (params) => {
  return axios.get("https://www.omdbapi.com/", {
    params: {
      apikey: process.env.OMDB_KEY,
      ...params,
    },
    timeout: 3000,
  });
};

// get movies (with optional search or category)
app.get("/api/movies", async (req, res) => {
  const query = req.query.q; // can be: popular | top_rated | upcoming | search text

  // 🔥 Detect if it's a category
  const isCategory = ["popular", "top_rated", "upcoming"].includes(query);

  // ===== 1. TRY TMDB =====
  try {
    console.log("Trying TMDB ✅");

    let tmdbRes;

    if (!query || query === "popular") {
      tmdbRes = await tmdbRequest("/movie/popular", {
        language: "en-US",
      });
    } else if (query === "top_rated") {
      tmdbRes = await tmdbRequest("/movie/top_rated", {
        language: "en-US",
      });
    } else if (query === "upcoming") {
      tmdbRes = await tmdbRequest("/movie/upcoming", {
        language: "en-US",
      });
    } else {
      // 🔍 real search
      tmdbRes = await tmdbRequest("/search/movie", {
        query,
        language: "en-US",
      });
    }

    return res.json({
      source: "tmdb",
      data: tmdbRes.data.results,
    });
  } catch (e) {
    console.log("TMDB failed ❌ → switching to OMDb");
  }

  // ===== 2. FALLBACK → OMDb =====
  try {
    // fallback search strategy for omdb:
    const fallbackMap = {
      popular: "avengers",
      top_rated: "batman",
      upcoming: "spider man",
    };

    let searchQuery;

    if (isCategory) {
      searchQuery = fallbackMap[query];
    } else {
      searchQuery = query || "avengers";
    }

    console.log("Using OMDb fallback for:", searchQuery);

    const omdbRes = await omdbRequest({
      s: searchQuery,
    });

    return res.json({
      source: "omdb",
      data: omdbRes.data.Search || [],
    });
  } catch (e) {
    console.log("OMDb failed ❌");
  }

  // all failed
  res.status(500).json({ error: "All APIs failed" });
});

// get movie details by TMDB or IMDb ID
app.get("/api/movie/:id", async (req, res) => {
  const { id } = req.params;

  // 🔥 If IMDb ID → try TMDB lookup first, then fallback to OMDb
  if (id.startsWith("tt")) {
    try {
      console.log("Detected IMDb ID → trying TMDB lookup first ✅");

      const findRes = await tmdbRequest(`/find/${id}`, {
        external_source: "imdb_id",
      });

      const movieResult = findRes.data.movie_results?.[0];

      if (movieResult?.id) {
        const tmdbRes = await tmdbRequest(`/movie/${movieResult.id}`, {
          language: "en-US",
        });

        const videosRes = await tmdbRequest(`/movie/${movieResult.id}/videos`);
        const trailer = videosRes.data.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );

        return res.json({
          source: "tmdb",
          data: {
            ...tmdbRes.data,
            trailerKey: trailer?.key || null,
          },
        });
      }

      console.log("TMDB lookup by IMDb ID returned no match → fallback to OMDb");
    } catch (e) {
      console.log("TMDB lookup via IMDb failed ❌", e.message);
    }

    try {
      console.log("Falling back to OMDb for IMDb ID ✅");

      const omdbRes = await omdbRequest({
        i: id,
      });

      return res.json({
        source: "omdb",
        data: omdbRes.data,
      });
    } catch (e) {
      console.log("OMDb direct fetch failed ❌", e.message);
    }
  }

  // ===== TRY TMDB =====
  try {
    console.log("Fetching detail from TMDB ✅");

    const tmdbRes = await tmdbRequest(`/movie/${id}`, {
      language: "en-US",
    });

    const videosRes = await tmdbRequest(`/movie/${id}/videos`);
    const trailer = videosRes.data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );

    return res.json({
      source: "tmdb",
      data: {
        ...tmdbRes.data,
        trailerKey: trailer?.key || null,
      },
    });
  } catch (e) {
    console.log("TMDB detail failed ❌ → fallback");
  }

  // ===== FALLBACK → OMDb via IMDb ID =====
  try {
    console.log("Trying OMDb via IMDb 🔁");

    const extRes = await tmdbRequest(`/movie/${id}/external_ids`);

    const imdbId = extRes.data.imdb_id;

    if (imdbId) {
      const omdbRes = await omdbRequest({
        i: imdbId,
      });

      return res.json({
        source: "omdb",
        data: omdbRes.data,
      });
    }
  } catch (e) {
    console.log("OMDb via IMDb failed ❌");
  }

  // ❌ all failed
  res.status(500).json({ error: "All detail APIs failed" });
});

// start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.REACT_APP_API_URL}:${PORT}`);
});