import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MarketList = () => {
  const [markets, setMarkets] = useState([]);
  const [searchParams, setSearchParams] = useState({
    city: '',
    state: '',
    postal_code: '',
    radius: 30, // Default to 30 miles
  });
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Number of markets per page
  const [totalPages, setTotalPages] = useState(1); // Total number of pages

  useEffect(() => {
    fetchMarkets(); // Fetch markets only when search parameters or sort config changes
  }, [searchParams, sortConfig, currentPage, pageSize]);

  const fetchMarkets = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
  
    try {
      const response = await axios.get('http://localhost:5000/markets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          ...searchParams,
          sort_key: sortConfig.key,
          sort_direction: sortConfig.direction,
          page: currentPage,
          page_size: pageSize,
        },
      });
      setMarkets(response.data.markets);
      setTotalPages(response.data.total_pages); // Update total pages based on backend response
    } catch (error) {
      // Check if the error is an authorization error (401 or 403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error('Authorization error, logging out');
        handleLogout(); // Log out user on auth error
      } else {
        console.error('Failed to fetch markets', error);
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);  // Reset to first page when searching
    fetchMarkets(); // Fetch markets with updated search parameters
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }));
  };

  const deleteMarket = async (marketId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:5000/markets/${marketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMarkets(markets.filter((market) => market.id !== marketId));
    } catch (error) {
      console.error('Failed to delete market', error);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div>
      <h2>Markets List</h2>
      <button onClick={handleLogout}>Logout</button>

      <div>
        <input
          type="text"
          name="city"
          value={searchParams.city}
          onChange={handleInputChange}
          placeholder="City"
        />
        <input
          type="text"
          name="state"
          value={searchParams.state}
          onChange={handleInputChange}
          placeholder="State"
        />
        <input
          type="text"
          name="postal_code"
          value={searchParams.postal_code}
          onChange={handleInputChange}
          placeholder="Postal Code"
        />
        <input
          type="number"
          name="radius"
          value={searchParams.radius}
          onChange={handleInputChange}
          placeholder="Radius (miles)"
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('id')}>ID</th>
            <th onClick={() => handleSort('name')}>Name</th>
            <th onClick={() => handleSort('city')}>City</th>
            <th onClick={() => handleSort('state')}>State</th>
            <th>Postal Code</th>
            <th onClick={() => handleSort('average_ranking')}>Ranking</th> {/* New column for ranking */}
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr key={market.id}>
              <td>{market.id}</td>
              <td>{market.name}</td>
              <td>{market.city}</td>
              <td>{market.state}</td>
              <td>{market.postal_code}</td>
              <td>{market.average_ranking ? market.average_ranking.toFixed(1) : '0'}</td> {/* Handle missing ranking */}
              <td>
                <Link to={`/markets/${market.id}`}>View Details</Link>
              </td>
              <td>
                <button onClick={() => deleteMarket(market.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default MarketList;
