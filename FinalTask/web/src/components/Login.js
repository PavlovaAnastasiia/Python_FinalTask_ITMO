import './Login.css';

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
//import { useAuth } from '../services/AuthContext';

const Login = () => {
  //const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();  // For navigating to another page

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password
      });

      const { access_token } = response.data;

      // Save the token in localStorage
      localStorage.setItem('access_token', access_token);
      //login();
      // Redirect to the Dashboard page upon successful login
      navigate('/markets');
    } catch (error) {
      setErrorMessage('Invalid username or password');
    }
  };

  // Redirect to the Register page when the "Register" button is clicked
  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <button type="submit">Login</button>
      </form>
      
      {/* Add a Register button to redirect users to the Register page */}
      <button className="register-button" onClick={handleRegisterRedirect}>
        Register
      </button>
    </div>
  );
};

export default Login;
