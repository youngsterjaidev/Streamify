from flask import Flask, jsonify, request,  send_from_directory
from pymongo import MongoClient
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from bson.json_util import dumps
import requests

app = Flask(__name__, static_folder='public/static', template_folder='public')

# TMDb API endpoint and API key
tmdb_api_endpoint = "https://api.themoviedb.org/3/search/movie"
tmdb_api_key = "bc18b03099c2898c08c79ab91336c8af"

omdb_api_key = "b9424a1f"
omdb_api_endpoint = "http://www.omdbapi.com/"

uri = "mongodb+srv://m001-student:m001-student@server967.eltku.mongodb.net/?retryWrites=true&w=majority&appName=Server967"

# Connect to MongoDB
client = MongoClient(uri)
db = client['Streamify']
movies_collection = db['movies']
ratings_collection = db['ratings']

# Load data from MongoDB into DataFrames
movies_df = pd.DataFrame(list(movies_collection.find()))
ratings_df = pd.DataFrame(list(ratings_collection.find()))

# Merge the DataFrames
movies_with_ratings = movies_df.merge(ratings_df, on='movieId')

# Create a pivot table
pivot_table = movies_with_ratings.pivot_table(index='title', columns="userId", values="rating").fillna(0)

# Create a sparse matrix
sparse_matrix = csr_matrix(pivot_table)

# Train the model
model = NearestNeighbors(metric='cosine', algorithm='brute')
model.fit(sparse_matrix)

def recommended_movies(title):
    movieId = pivot_table.index.get_loc(title)
    result = []
    distance, suggestion = model.kneighbors(pivot_table.iloc[[movieId], :])
    for idx in suggestion[0][1:]:
        result.append({
            "title": pivot_table.index[idx],
            })
    return result

@app.route("/search")
def hello_world():
    query = request.args.get('q')
    result = recommended_movies(int(query))
    return jsonify(result)

@app.route("/")
def index():
    return send_from_directory('public', 'index.html')

# Serve index.js file
@app.route('/index.js')
def send_index_js():
    return send_from_directory('public', 'index.js')

# Serve index.css file
@app.route('/index.css')
def send_index_css():
    return send_from_directory('public', 'index.css')

# Route to fetch movies info, limited to 50
@app.route('/movies', methods=['GET'])
def get_movies():
    movies = list(movies_collection.find({}, {'_id': 0}).limit(50))
    return jsonify(movies)

# Default movie poster image
default_poster_url = "https://via.placeholder.com/500x750.png?text=Movie+Poster+Not+Found"

# Route to retrieve movie posters by title
@app.route('/movie/poster', methods=['GET'])
def get_movie_poster():
    movie_title = request.args.get('title')
    if movie_title:
        params = {
            'apikey': omdb_api_key,
            't': movie_title
        }
        response = requests.get(omdb_api_endpoint, params=params)
        if response.status_code == 200:
            data = response.json()
            poster_url = data.get('Poster')
            if poster_url and poster_url != "N/A":
                return jsonify({'poster_url': poster_url})
            else:
                return jsonify({'poster_url': default_poster_url})
        else:
            return jsonify({'error': 'Failed to retrieve movie poster'}), 500
    else:
        return jsonify({'error': 'Movie title is required'}), 400

# Route to search for movies by title
@app.route('/search/movies', methods=['GET'])
def search_movies():
    title = request.args.get('title')
    if title:
        movies = movies_collection.find({'title': {'$regex': title, '$options': 'i'}}).limit(5)
        movies_data = []
        for movie in movies:
            movie_data = {
                'title': movie['title'],
                'genres': movie['genres'],
                'url': movie.get('url', '')
            }
            movies_data.append(movie_data)

        # Get recommendations for the searched movie
        recommendations = recommended_movies(movie_data['title'])
        return jsonify({
            'movies': movies_data,
            'recommendations': recommendations
        })
    else:
        return jsonify({'error': 'Movie title is required'}), 400

if __name__ == '__main__':
    app.run(debug=True)