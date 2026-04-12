import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import UserActivity from "./models/UserActivity.js";

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
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

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

const detectIntent = (message) => {
  const msg = message.toLowerCase();

  if (["hi", "hello", "hey", "yo", "sup"].some((w) => msg === w)) {
    return "greeting";
  }

  if (
    [
      "suggest",
      "recommend",
      "good",
      "best",
      "watch",
      "movies",
      "shows",
      "series",
      "like",
      "similar",
      "of",
      "featuring",
      "starring",
      "with",
    ].some((w) => msg.includes(w))
  ) {
    return "recommendation";
  }

  return "chat";
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

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    const cleanMsg = message.trim().toLowerCase();
    const intent = detectIntent(cleanMsg);

    if (intent === "greeting") {
      return res.json({
        data: [],
        text: "Hey! 👋 What kind of movies/shows are you looking for?"
      });
    }

    if (intent === "chat") {
      const prompt = `
    You are a friendly movie assistant.

    User: ${message}

    Respond conversationally in 1-2 lines.
    `;

      const aiRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const text = aiRes.choices[0].message.content;

      return res.json({
        text,
        data: [],
      });
    }

    if (intent === "recommendation") {
      const prompt = `
      You are a strict movie recommendation engine.

      User query: "${message}"

      RULES:
      - ALWAYS return 5 results
      - NEVER explain outside JSON
      - NEVER talk casually
      - If actor mentioned → return their works
      - If vague → return popular content

      Return ONLY JSON array:

      [
        { "title": "Name", "reason": "Short reason" }
      ]
      `;

      const aiRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const text = aiRes.choices[0].message.content;

      let parsed;

      try {
        parsed = JSON.parse(text);
      } catch {
        return res.json({ data: [], text: "Something went wrong." });
      }

      let movies = [];
      let responseText = "";

      if (Array.isArray(parsed)) {
        movies = parsed;
      } else {
        responseText = parsed.text || "";
        movies = parsed.data || [];
      }

      // 🔥 IMPORTANT: enrich with real data from your API
      const enrichedMovies = await Promise.all(
        movies.map(async (movie) => {
          try {
            // Step 1: Search by title to get IMDb ID
            const searchRes = await axios.get(
              `${BASE_URL}/api/movies?q=${movie.title}`
            );

            const results = searchRes.data.data;

            // If no results, return original with dummy poster and null ID
            if (!results || results.length === 0) {
              return {
                ...movie,
                poster: "https://dummyimage.com/80x120/000/fff&text=No",
                id: null,
              };
            }

            // Try to find an exact title match (case-insensitive)
            const match = results.find(
              (r) =>
                (r.Title || "").toLowerCase() === movie.title.toLowerCase()
            );

            const first = match || results[0];
            return {
              ...movie,
              poster:
                first.Poster && first.Poster !== "N/A"
                  ? first.Poster
                  : "https://dummyimage.com/80x120/000/fff&text=No",
              id: first.imdbID || null,
            };
          } catch (e) {
            console.log("Enrich error:", movie.title);
            return movie;
          }
        })
      );

      return res.json({
        text: "",
        data: enrichedMovies,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.post("/api/user/activity", async (req, res) => {
  const { userId, movie, search } = req.body;

  let user = await UserActivity.findOne({ userId });

  if (!user) {
    user = new UserActivity({ userId, viewedMovies: [], searches: [] });
  }

  if (movie) {
    const exists = user.viewedMovies.some(
      (m) => m.title === movie.title
    );

    if (!exists) {
      user.viewedMovies.push(movie);
    }

    user.viewedMovies = user.viewedMovies.slice(-10);
  }

  if (search) {
    user.searches.push(search);
  }

  await user.save();

  res.json({ success: true });
});

app.get("/api/user/recommendations/:userId", async (req, res) => {
  try {
    const scoreMovie = (movie, seedTerms) => {
      const title = (movie.title || movie.Title || "").toLowerCase();

      let score = 0;

      seedTerms.forEach((term, index) => {
        const weight = seedTerms.length - index; // recent = higher weight

        if (title === term) {
          score += 100 * weight; // 🔥 exact match
        } else if (title.includes(term)) {
          score += 50 * weight; // 🔥 partial match
        }
      });

      return score;
    };

    const { userId } = req.params;

    const activities = await UserActivity.find({ userId });

    if (!activities.length) {
      return res.json({ data: [] });
    }

    // ✅ 1. Extract signals
    const searchTerms = activities.flatMap((a) => a.searches || []);

    const movieTitles = activities.flatMap((a) =>
      (a.viewedMovies || []).map((m) => m.title)
    );

    const combined = [
      ...searchTerms.slice(-3),
      ...movieTitles.slice(-2),
    ];

    if (!combined.length) {
      return res.json({ data: [] });
    }

    // ✅ 2. Clean + dedupe + prioritize recent
    const clean = (str) =>
      str.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

    const uniqueTerms = [...new Set(combined.map(clean).filter(Boolean))].reverse();

    // 🎯 pick top 2–3 strong signals
    const seedTerms = uniqueTerms.slice(0, 3);

    console.log("Personalization seeds:", seedTerms);

    // ✅ 3. Call movies API multiple times
    const responses = await Promise.all(
      seedTerms.map((term) =>
        axios
          .get(`${BASE_URL}/api/movies?q=${encodeURIComponent(term)}`)
          .catch(() => ({ data: { data: [] } })) // fail-safe
      )
    );

    // ✅ 4. Merge results
    let merged = responses.flatMap((r) => r.data.data || []);

    // ✅ 5. Deduplicate (important)
    const seen = new Set();
    merged = merged.filter((movie) => {
      const id = movie.id || movie.imdbID;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // ✅ 6. Limit results (clean UI)
    merged = merged
      .map((movie) => ({
        ...movie,
        _score: scoreMovie(movie, seedTerms),
      }))
      .sort((a, b) => b._score - a._score);

    // remove score before sending
    merged = merged.map(({ _score, ...rest }) => rest);

    // limit results
    merged = merged.slice(0, 20);

    res.json({ data: merged });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// start mongoDB & server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${BASE_URL}`);
    });
  })
  .catch(err => console.log(err));