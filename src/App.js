// App.js
import React from 'react';
import Sudoku from './components/Sudoku'; // Assuming Sudoku.js is in the same directory
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Sudoku />
    </div>
  );
}

export default App;