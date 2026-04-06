const movieCache = new Map();
const pendingRequests = new Map(); // 🔥 NEW

export const getCachedMovie = (id) => movieCache.get(id);

export const setCachedMovie = (id, data) => {
  movieCache.set(id, data);
};

export const getPendingRequest = (id) => pendingRequests.get(id);

export const setPendingRequest = (id, promise) => {
  pendingRequests.set(id, promise);
};

export const clearPendingRequest = (id) => {
  pendingRequests.delete(id);
};