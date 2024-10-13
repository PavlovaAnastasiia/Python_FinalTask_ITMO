import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

const MarketDetails = () => {
  const { id } = useParams(); // Get the market ID from the URL
  const [market, setMarket] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ score: '', text: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true); // State to manage login status
  const navigate = useNavigate(); // For the back button navigation

  // Check for token and set login status
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoggedIn(false); // User is not logged in
    }
  }, []);

  // Fetch market details and reviews if logged in
  useEffect(() => {
    const fetchMarketDetails = async () => {
      const token = localStorage.getItem('access_token'); // Get the token again inside the fetch function
      try {
        const marketResponse = await axios.get(`http://localhost:5000/markets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMarket(marketResponse.data);

        const reviewsResponse = await axios.get(`http://localhost:5000/markets/${id}/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReviews(reviewsResponse.data);
      } catch (error) {
        console.error('Failed to fetch market details or reviews');
      }
    };

    // Fetch data only if the user is logged in
    if (isLoggedIn) {
      fetchMarketDetails();
    }
  }, [id, isLoggedIn]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview((prevReview) => ({
      ...prevReview,
      [name]: value,
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      // Convert the score to a number before sending
      const reviewToSubmit = {
        score: Number(newReview.score), // Ensure score is a number
        text: newReview.text,
      };

      await axios.post(`http://localhost:5000/markets/${id}/reviews`, reviewToSubmit, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch reviews again after adding a new one
      const reviewsResponse = await axios.get(`http://localhost:5000/markets/${id}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReviews(reviewsResponse.data);
      setNewReview({ score: '', text: '' }); // Clear the form
      setErrorMessage(''); // Clear any previous error message
    } catch (error) {
      setErrorMessage('Failed to submit review. Ensure the score is between 1 and 5.');
    }
  };

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (!market) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>Back</button>

      <h2>Market Details</h2>
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <td>{market.name}</td>
          </tr>
          <tr>
            <th>City</th>
            <td>{market.city}</td>
          </tr>
          <tr>
            <th>State</th>
            <td>{market.state}</td>
          </tr>
          <tr>
            <th>Postal Code</th>
            <td>{market.postal_code}</td>
          </tr>
          <tr>
            <th>Latitude</th>
            <td>{market.latitude}</td>
          </tr>
          <tr>
            <th>Longitude</th>
            <td>{market.longitude}</td>
          </tr>
        </tbody>
      </table>

      <h3>Reviews</h3>
      <ul>
        {reviews.map((review) => (
          <li key={review.id}>
            <strong>{review.username}:</strong> {review.text} (Score: {review.score})
          </li>
        ))}
      </ul>

      <h3>Add a Review</h3>
      <form onSubmit={handleSubmitReview}>
        <div>
          <label>Score (1-5):</label>
          <input
            type="number"
            name="score"
            value={newReview.score}
            onChange={handleReviewChange}
            required
            min="1"
            max="5"
          />
        </div>
        <div>
          <label>Review Text:</label>
          <textarea
            name="text"
            value={newReview.text}
            onChange={handleReviewChange}
            required
          />
        </div>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
};

export default MarketDetails;
