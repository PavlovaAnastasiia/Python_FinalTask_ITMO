// src/services/api.js
import axios from 'axios';

const API_URL = 'http:backend//:5000';

const getToken = () => localStorage.getItem('access_token');

export const registerUser = (username, password) => {
  return axios.post(`${API_URL}/register`, { username, password });
};

export const loginUser = (username, password) => {
  return axios.post(`${API_URL}/login`, { username, password });
};

export const getMarkets = () => {
  return axios.get(`${API_URL}/markets`);
};

export const getReviews = (marketId) => {
  return axios.get(`${API_URL}/markets/${marketId}/reviews`);
};

export const createReview = (marketId, score, text) => {
  return axios.post(
    `${API_URL}/markets/${marketId}/reviews`,
    { score, text },
    {
      headers: { Authorization: `Bearer ${getToken()}` }
    }
  );
};
