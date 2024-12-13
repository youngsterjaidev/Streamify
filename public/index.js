

// script.js

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
          movie.url = posterData.poster_url;
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
          movies: updatedData,
        },
        {
          title: 'Recommended Movies',
          movies: updatedData.slice(20, 40),
        },
        {
          title: 'Trending Movies',
          movies: updatedData.slice(40, 49),
        },
      ];

      sections.forEach((section, index) => {
        const movieRow = movieRows[index];

        section.movies.forEach(movie => {
          const movieThumbnail = document.createElement('div');
          movieThumbnail.classList.add('movie-thumbnail');

          // Create an image element for the movie poster
          const moviePoster = document.createElement('img');
          moviePoster.src = movie.url;
          movieThumbnail.appendChild(moviePoster);

          // Create a text node for the movie title
          const movieTitle = document.createElement('div');
          movieTitle.classList.add('movie-title');
          movieTitle.textContent = movie.title;
          movieThumbnail.appendChild(movieTitle);

          // Create a text node for the movie genres
          const movieGenres = document.createElement('div');
          movieGenres.classList.add('movie-genres');
          movieGenres.textContent = movie.genres;
          movieThumbnail.appendChild(movieGenres);

          movieRow.appendChild(movieThumbnail);
        });
      });
    });
  })
  .catch(error => console.error(error));

// Add this JavaScript code to make the search input sticky
const heroSection = document.querySelector('.hero-section');
const searchInput = document.querySelector('#search-input');

// Add an event listener to the window scroll event
window.addEventListener('scroll', () => {
  // Check if the window has scrolled past the hero section
  if (window.scrollY > 300) {
    // Add the sticky class to the hero section and search input
    heroSection.classList.add('sticky');
    // searchInput.classList.add('sticky-search-input');
  } else {
    // Remove the sticky class from the hero section and search input
    heroSection.classList.remove('sticky');
    //searchInput.classList.remove('sticky-search-input');
  }
});

const searchResultsDiv = document.querySelector('.search-results');
const searchResultsContainer = document.querySelector('.search-results-container');

searchInput.addEventListener('input', async () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        try {
            const response = await fetch(`/search/movies?title=${searchTerm}`);
            const data = await response.json();
            const moviesHtml = data.movies.map(movie => `
                <div class="movie-result">
                    <h5 style="text-align: left;">${movie.title}</h5>
                </div>
            `).join('');
            const recommendationsHtml = data.recommendations.map(recommendation => `
                <div class="recommendation">
                    <h5 style="text-align: left;">${recommendation.title}</h5>
                </div>
            `).join('');
            searchResultsDiv.innerHTML = `
                ${moviesHtml}
                <h3>Recommendations:</h3>
                ${recommendationsHtml}
            `;
            searchResultsContainer.style.display = 'block';
        } catch (error) {
            console.error(error);
        }
    } else {
        searchResultsDiv.innerHTML = '';
        searchResultsContainer.style.display = 'none';
    }
});