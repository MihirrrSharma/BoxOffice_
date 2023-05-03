import './App.css';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Header from './components/header/Header';
import Home from './pages/home/Home';
import MovieList from './components/movielist/movieList';
import Movie from './pages/home/movieDetail/movie';

// D:\acer\BoxOffice\imdb-fe\src\components\movielist\movieList.js
function App() {
  return  (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route index element = {<Home />}></Route>
          <Route path="movie/:id" element={<Movie />}></Route>
          <Route path="movies/:type" element={<MovieList />}></Route>
          <Route path="/*" element={<h1>Error page</h1>}></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
