// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Fetch movie data from the /movies endpoint
  fetch('/movies')
      .then(response => response.json())
      .then(data => {
          // Process the movie data here...
          console.log(data);

          // Fetch poster URLs for each movie
          const promises = data.map(movie => {
              const title = movie.title.replace(/ \(\d{4}\)$/, '');
              return fetch(`/movie/poster?title=${title}`)
                  .then(response => response.json())
                  .then(posterData => {
                      movie.poster_url = posterData.poster_url;
                      movie.rating = (Math.random() * 3 + 2).toFixed(1); // Random rating for demo
                      return movie;
                  });
          });

          // Wait for all promises to resolve
          Promise.all(promises).then(updatedData => {
              // Render the movie data to the page...
              const movieRows = document.querySelectorAll('.movie-row');
              const sections = [
                  {
                      title: 'Movies You Like',
                      movies: updatedData.slice(0, 10),
                  },
                  {
                      title: 'Recommended Movies',
                      movies: updatedData.slice(10, 20),
                  },
                  {
                      title: 'Trending Movies',
                      movies: updatedData.slice(20, 30),
                  },
                  {
                      title: 'Popular TV Shows',
                      movies: updatedData.slice(30, 40),
                  }
              ];

              sections.forEach((section, index) => {
                  const movieRow = movieRows[index];
                  movieRow.innerHTML = ''; // Clear any existing content

                  section.movies.forEach(movie => {
                      const movieThumbnail = document.createElement('div');
                      movieThumbnail.classList.add('movie-thumbnail');

                      // Create an image element for the movie poster
                      const moviePoster = document.createElement('img');
                      moviePoster.src = movie.poster_url || 'https://via.placeholder.com/200x300?text=No+Poster';
                      moviePoster.alt = movie.title;
                      movieThumbnail.appendChild(moviePoster);

                      // Create movie info overlay
                      const movieInfo = document.createElement('div');
                      movieInfo.classList.add('movie-info');

                      // Create a text node for the movie title
                      const movieTitle = document.createElement('div');
                      movieTitle.classList.add('movie-title');
                      movieTitle.textContent = movie.title.length > 20 ? movie.title.substring(0, 20) + '...' : movie.title;
                      movieInfo.appendChild(movieTitle);

                      // Create a text node for the movie genres
                      const movieGenres = document.createElement('div');
                      movieGenres.classList.add('movie-genres');
                      movieGenres.textContent = movie.genres ? movie.genres.split('|').slice(0, 2).join(', ') : 'N/A';
                      movieInfo.appendChild(movieGenres);

                      // Create rating element
                      const movieRating = document.createElement('div');
                      movieRating.classList.add('movie-rating');
                      movieRating.innerHTML = `<i class="fas fa-star"></i> ${movie.rating}`;
                      movieInfo.appendChild(movieRating);

                      movieThumbnail.appendChild(movieInfo);
                      movieRow.appendChild(movieThumbnail);
                  });
              });
          });
      })
      .catch(error => console.error('Error fetching movies:', error));

  // Search functionality
  const searchInput = document.getElementById('search-input');
  const searchResultsDiv = document.querySelector('.search-results');
  const searchResultsContainer = document.querySelector('.search-results-container');
  const searchIcon = document.querySelector('.search-icon');
  const searchBox = document.querySelector('.search-box');

  // Toggle search box on mobile
  searchIcon.addEventListener('click', function() {
      searchBox.classList.toggle('active');
      if (searchBox.classList.contains('active')) {
          searchInput.focus();
      }
  });

  // Search input event listener with debounce
  let searchTimeout;
  searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const searchTerm = searchInput.value.trim();
      
      if (searchTerm.length >= 2) {
          searchTimeout = setTimeout(async () => {
              try {
                  const response = await fetch(`/search/movies?title=${encodeURIComponent(searchTerm)}`);
                  const data = await response.json();
                  
                  if (data.movies && data.movies.length > 0) {
                      const moviesHtml = data.movies.map(movie => `
                          <div class="movie-result">
                              ${movie.poster_url ? `<img src="${movie.poster_url}" alt="${movie.title}">` : ''}
                              <div>
                                  <h5>${movie.title}</h5>
                                  <p>${movie.genres ? movie.genres.split('|').slice(0, 3).join(', ') : 'N/A'}</p>
                                  <div class="movie-rating"><i class="fas fa-star"></i> ${(Math.random() * 3 + 2).toFixed(1)}</div>
                              </div>
                          </div>
                      `).join('');
                      
                      const recommendationsHtml = data.recommendations ? data.recommendations.map(recommendation => `
                          <div class="recommendation">
                              ${recommendation.poster_url ? `<img src="${recommendation.poster_url}" alt="${recommendation.title}">` : ''}
                              <div>
                                  <h5>${recommendation.title}</h5>
                                  <p>${recommendation.genres ? recommendation.genres.split('|').slice(0, 3).join(', ') : 'N/A'}</p>
                                  <div class="movie-rating"><i class="fas fa-star"></i> ${(Math.random() * 3 + 2).toFixed(1)}</div>
                              </div>
                          </div>
                      `).join('') : '';
                      
                      searchResultsDiv.innerHTML = `
                          <h4>Search Results for "${searchTerm}"</h4>
                          ${moviesHtml}
                          ${recommendationsHtml ? `<h4>Recommendations</h4>${recommendationsHtml}` : ''}
                      `;
                      searchResultsContainer.style.display = 'block';
                  } else {
                      searchResultsDiv.innerHTML = `<p>No results found for "${searchTerm}"</p>`;
                      searchResultsContainer.style.display = 'block';
                  }
              } catch (error) {
                  console.error('Search error:', error);
                  searchResultsDiv.innerHTML = `<p>Error loading search results</p>`;
                  searchResultsContainer.style.display = 'block';
              }
          }, 300);
      } else {
          searchResultsContainer.style.display = 'none';
      }
  });

  // Close search results when clicking outside
  document.addEventListener('click', function(e) {
      if (!searchBox.contains(e.target)) {
          searchResultsContainer.style.display = 'none';
      }
  });

  // Header scroll effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
          header.style.backgroundColor = 'rgba(34, 31, 31, 0.95)';
          header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
      } else {
          header.style.backgroundColor = 'var(--secondary-color)';
          header.style.boxShadow = 'none';
      }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
          e.preventDefault();
          document.querySelector(this.getAttribute('href')).scrollIntoView({
              behavior: 'smooth'
          });
      });
  });
});