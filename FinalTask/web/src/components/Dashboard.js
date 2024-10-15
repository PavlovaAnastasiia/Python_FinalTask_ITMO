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
  const [sortConfig, setSortConfig] = useState({
    name: null, // No sorting by default
    city: null,
    state: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Number of markets per page
  const [totalPages, setTotalPages] = useState(1); // Total number of pages

  useEffect(() => {
    fetchMarkets(); // Fetch markets when search params, sort config, page or pageSize changes
  }, [searchParams, sortConfig, currentPage, pageSize]);

  const fetchMarkets = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Prepare the sorting query params
    const sortKeys = Object.keys(sortConfig).filter(key => sortConfig[key] !== null);
    const sortDirections = sortKeys.map(key => sortConfig[key]);

    try {
      const response = await axios.get('http://localhost:5000/markets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          ...searchParams,
          sort_key: sortKeys.join(','), // Send as a comma-separated list
          sort_direction: sortDirections.join(','), // Send as a comma-separated list
          page: currentPage,
          page_size: pageSize,
        },
      });
      setMarkets(response.data.markets);
      setTotalPages(response.data.total_pages); // Update total pages based on backend response
    } catch (error) {
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

  const handleSortChange = (key, value) => {
    setSortConfig((prevSortConfig) => ({
      ...prevSortConfig,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setSearchParams({
      city: '',
      state: '',
      postal_code: '',
      radius: 30,
    });
    setSortConfig({
      name: null,
      city: null,
      state: null,
    });
    setCurrentPage(1);
    fetchMarkets();
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
        <h3>Search</h3>
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
        <button
          onClick={handleSearch}
          style={{ display: 'none' }} // This will completely remove it from the layout
        >
          Search
        </button>
        <button onClick={resetFilters}>Reset</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>
              Name
              <div>
                <select value={sortConfig.name || ''} onChange={(e) => handleSortChange('name', e.target.value)}>
                  <option value="">Sort</option>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </th>
            <th>
              City
              <div>
                <select value={sortConfig.city || ''} onChange={(e) => handleSortChange('city', e.target.value)}>
                  <option value="">Sort</option>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </th>
            <th>
              State
              <div>
                <select value={sortConfig.state || ''} onChange={(e) => handleSortChange('state', e.target.value)}>
                  <option value="">Sort</option>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </th>
            <th>Postal Code</th>
            <th>Ranking</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr key={market.id}>
              <td>{market.name}</td>
              <td>{market.city}</td>
              <td>{market.state}</td>
              <td>{market.postal_code}</td>
              <td>{market.average_ranking ? market.average_ranking.toFixed(1) : '0'}</td>
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
