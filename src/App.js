import './App.css';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/header/Header';
import Home from './pages/home/Home';
import MovieList from './components/movielist/movieList';
import Movie from './pages/home/movieDetail/movie';
import Chat from "./components/chat/Chat";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

function App() {
  return  (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <Router>
            <Header />
            <Routes>
              <Route index element = {<Home />}></Route>
              <Route path="movie/:id" element={<Movie />}></Route>
              <Route path="movies/:type" element={<MovieList />}></Route>
              <Route path="/*" element={<h1>Error page</h1>}></Route>
            </Routes>

            <Chat />
          </Router>
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
