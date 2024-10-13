from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
from werkzeug.security import generate_password_hash, check_password_hash
from geopy.distance import geodesic

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'Krasivaya_Devuska'  # Change this to a secure key in production
jwt = JWTManager(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'mysql+pymysql://{os.getenv("DATABASE_USER")}:{os.getenv("DATABASE_PASSWORD")}@'
    f'{os.getenv("DATABASE_HOST")}/{os.getenv("DATABASE_NAME")}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class Market(db.Model):
    __tablename__ = 'markets'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(200))
    state = db.Column(db.String(50))
    postal_code = db.Column(db.String(20))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    text = db.Column(db.Text, nullable=True)
    score = db.Column(db.Integer, nullable=False)

    market = db.relationship('Market', backref=db.backref('reviews', lazy=True))

# User Registration
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data['username']
    password = data['password']
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

# User Login (JWT Token Generation)
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']
    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=username)
    return jsonify({'access_token': access_token}), 200

@app.route('/markets', methods=['GET'])
@jwt_required()
def get_markets():
    city = request.args.get('city')
    state = request.args.get('state')
    postal_code = request.args.get('postal_code')
    radius = request.args.get('radius', type=float, default=30)  # Default to 30 miles
    user_latitude = request.args.get('latitude', type=float)
    user_longitude = request.args.get('longitude', type=float)
    sort_key = request.args.get('sort_key', 'id')  # Default sort by ID
    sort_direction = request.args.get('sort_direction', 'asc')
    page = request.args.get('page', type=int, default=1)  # Current page
    page_size = request.args.get('page_size', type=int, default=10)  # Results per page

    query = Market.query

    if city:
        query = query.filter(Market.city.ilike(f'%{city}%'))
    if state:
        query = query.filter(Market.state.ilike(f'%{state}%'))
    if postal_code:
        query = query.filter(Market.postal_code.ilike(f'%{postal_code}%'))

    # Apply distance filtering if latitude and longitude are provided
    if user_latitude is not None and user_longitude is not None:
        markets_within_radius = []
        for market in query.all():
            market_location = (market.latitude, market.longitude)
            user_location = (user_latitude, user_longitude)
            distance = geodesic(user_location, market_location).miles
            if distance <= radius:
                markets_within_radius.append(market)

        query = Market.query.filter(Market.id.in_([m.id for m in markets_within_radius]))

    # Fetch all the markets before applying sorting and pagination
    markets = query.all()

    # Prepare market data including average review ranking
    market_data = []
    for market in markets:
        reviews = Review.query.filter_by(market_id=market.id).all()
        if reviews:
            average_ranking = sum([review.score for review in reviews]) / len(reviews)
        else:
            average_ranking = 0  # No reviews, so average ranking is 0

        market_data.append({
            'id': market.id,
            'name': market.name,
            'city': market.city,
            'state': market.state,
            'postal_code': market.postal_code,
            'latitude': market.latitude,
            'longitude': market.longitude,
            'average_ranking': average_ranking  # Add average ranking to market data
        })

    # Apply sorting for average_ranking or other fields
    if sort_key == 'average_ranking':
        market_data.sort(key=lambda x: x['average_ranking'], reverse=(sort_direction == 'desc'))
    else:
        market_data.sort(key=lambda x: x[sort_key], reverse=(sort_direction == 'desc'))

    # Paginate the sorted market data
    total_markets = len(market_data)
    total_pages = (total_markets + page_size - 1) // page_size  # Calculate total pages
    paginated_data = market_data[(page - 1) * page_size: page * page_size]  # Apply pagination

    return jsonify({
        'markets': paginated_data,
        'total_pages': total_pages
    }), 200



# Endpoint to fetch a specific market by ID
@app.route('/markets/<int:market_id>', methods=['GET'])
@jwt_required()
def get_market_by_id(market_id):
    market = Market.query.get(market_id)
    if not market:
        return jsonify({'error': 'Market not found'}), 404

    # Fetch the associated reviews
    reviews = Review.query.filter_by(market_id=market_id).all()

    market_data = {
        'id': market.id,
        'name': market.name,
        'city': market.city,
        'state': market.state,
        'postal_code': market.postal_code,
        'latitude': market.latitude,
        'longitude': market.longitude,
        'reviews': [{
            'id': review.id,
            'username': review.username,
            'text': review.text,
            'score': review.score
        } for review in reviews]
    }

    return jsonify(market_data), 200

# Endpoint to delete a market (requires JWT)
@app.route('/markets/<int:market_id>', methods=['DELETE'])
@jwt_required()
def delete_market(market_id):
    # Fetch the market by ID
    market = Market.query.get(market_id)
    
    if not market:
        return jsonify({'error': 'Market not found'}), 404

    # Delete all reviews associated with the market
    Review.query.filter_by(market_id=market_id).delete()

    # Delete the market
    db.session.delete(market)
    db.session.commit()

    return jsonify({'message': f'Market with ID {market_id} and its reviews have been deleted'}), 200


# Endpoint to fetch reviews of a specific market
@app.route('/markets/<int:market_id>/reviews', methods=['GET'])
@jwt_required()
def get_reviews(market_id):
    reviews = Review.query.filter_by(market_id=market_id).all()
    return jsonify([{
        'id': review.id,
        'username': review.username,
        'text': review.text,
        'score': review.score
    } for review in reviews]), 200

# Endpoint to create a review (requires JWT)
@app.route('/markets/<int:market_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(market_id):
    username = get_jwt_identity()
    data = request.get_json()
    score = data.get('score')
    text = data.get('text', '')

    if not isinstance(score, int) or not (1 <= score <= 5):
        return jsonify({'error': 'Score must be an integer between 1 and 5'}), 400

    new_review = Review(market_id=market_id, username=username, text=text, score=score)
    db.session.add(new_review)
    db.session.commit()

    return jsonify({
        'message': 'Review submitted successfully',
        'data': {'username': username, 'score': score, 'text': text}
    }), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
