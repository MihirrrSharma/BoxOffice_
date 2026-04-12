import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
  userId: String,
  viewedMovies: [
    {
      title: String,
      genres: [String],
    },
  ],
  searches: [String],
}, { timestamps: true });

export default mongoose.model("UserActivity", userActivitySchema);