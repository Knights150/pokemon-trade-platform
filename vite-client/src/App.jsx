import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import UploadForm from './components/UploadForm.jsx';
import SearchResultsPage from './components/SearchResultsPage.jsx';

// Pages
import MyInventoryPage from './pages/MyInventoryPage.jsx'; // Owner's inventory with toggle
import PublicInventoryPage from './pages/PublicInventoryPage.jsx'; // Public view only

function App() {
  return (
    <Router>
      <Routes>
        {/* Upload page */}
        <Route path="/" element={<UploadForm />} />

        {/* Search results page */}
        <Route path="/search" element={<SearchResultsPage />} />

        {/* Owner's inventory page */}
        <Route path="/my-inventory" element={<MyInventoryPage />} />

        {/* Public inventory view by userId (e.g., /user/1/inventory) */}
        <Route path="/user/:userId/inventory" element={<PublicInventoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
