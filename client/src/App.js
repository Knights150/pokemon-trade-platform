import React from 'react';
import Navbar from './components/Navbar';
import UploadForm from './components/UploadForm';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <main className="p-6 max-w-4xl mx-auto">
        <UploadForm />
      </main>
    </div>
  );
}

export default App;
