import React, { useState, useEffect } from "react";
import { Button, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import axios from "axios";

const Sudoku = () => {
  const [board, setBoard] = useState(
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [originalBoard, setOriginalBoard] = useState([]);
  const [invalidCells, setInvalidCells] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [difficulty, setDifficulty] = useState("easy");
  const [hasInvalidMove, setHasInvalidMove] = useState(false);
  const [blinkInvalid, setBlinkInvalid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generatePuzzle();
  }, [difficulty]);

  useEffect(() => {
    if (hasInvalidMove) {
      const timer = setTimeout(() => {
        setBlinkInvalid(false);
      }, 500);
      setBlinkInvalid(true);
      return () => clearTimeout(timer);
    }
  }, [hasInvalidMove]);

  const generatePuzzle = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/generate?difficulty=${difficulty}`
      );
      setBoard(response.data.board);
      setOriginalBoard(response.data.board);
      setInvalidCells(new Set());
      setHistory([]);
      setHasInvalidMove(false);
    } catch (error) {
      console.error("Error generating puzzle:", error);
    } finally {
      setLoading(false);
    }
  };

  const isValidMove = (row, col, value, currentBoard) => {
    if (value === 0) return true;
    const boardToCheck = currentBoard || board;

    // Check row
    for (let c = 0; c < 9; c++) {
      if (boardToCheck[row][c] === value && c !== col) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (boardToCheck[r][col] === value && r !== row) return false;
    }

    // Check 3x3 block
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (
          boardToCheck[startRow + i][startCol + j] === value &&
          (startRow + i !== row || startCol + j !== col)
        )
          return false;
      }
    }
    return true;
  };

  const handleChange = (row, col, value) => {
    if (!originalBoard.length || originalBoard[row][col] !== 0) return;

    const newValue = Number(value) || 0;
    const currentBoard = board.map((r) => [...r]);
    currentBoard[row][col] = newValue;

    const isValid = isValidMove(row, col, newValue, currentBoard);
    const cellId = `${row}-${col}`;

    if (!isValid) {
      setInvalidCells(new Set([cellId]));
      setHasInvalidMove(true);
    } else {
      const newInvalidCells = new Set(invalidCells);
      newInvalidCells.delete(cellId);
      setInvalidCells(newInvalidCells);
      setHasInvalidMove(newInvalidCells.size > 0);
    }

    setHistory([...history, { row, col, prevValue: board[row][col] }]);
    const newBoard = board.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? newValue : c))
    );
    setBoard(newBoard);
  };

  const undoMove = () => {
    if (history.length === 0) return;
    const lastMove = history.pop();
    const newBoard = board.map((r, i) =>
      r.map((c, j) =>
        i === lastMove.row && j === lastMove.col ? lastMove.prevValue : c
      )
    );
    setBoard(newBoard);
    setHistory([...history]);
    setInvalidCells(new Set());
    setHasInvalidMove(false);
  };

  const isOriginalCell = (row, col) =>
    originalBoard.length > 0 && originalBoard[row][col] !== 0;

  const handleFocus = (row, col) => {
    if (hasInvalidMove && !invalidCells.has(`${row}-${col}`)) {
      const element = document.activeElement;
      if (element instanceof HTMLInputElement) {
        element.blur();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Sudoku</h1>
      <RadioGroup
        row
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="mb-4"
      >
        <FormControlLabel value="easy" control={<Radio />} label="Easy" />
        <FormControlLabel value="medium" control={<Radio />} label="Medium" />
        <FormControlLabel value="hard" control={<Radio />} label="Hard" />
        <FormControlLabel value="expert" control={<Radio />} label="Expert" />
      </RadioGroup>
      {loading ? (
        <p>Loading Sudoku puzzle...</p>
      ) : (
        <div className="grid grid-rows-9 border-4 border-black bg-white p-4 shadow-lg rounded-lg">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-9">
              {row.map((cell, colIndex) => (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  maxLength="1"
                  value={cell === 0 ? "" : cell}
                  onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                  onFocus={() => handleFocus(rowIndex, colIndex)}
                  className={`w-12 h-12 text-center text-lg font-bold border border-gray-400 ${
                    invalidCells.has(`${rowIndex}-${colIndex}`)
                      ? `border-4 border-red-500 ${
                          blinkInvalid ? 'text-red-500' : ''
                        }`
                      : isOriginalCell(rowIndex, colIndex)
                      ? 'bg-gray-100'
                      : 'bg-white'
                  }`}
                  style={{
                    textAlign: "center",
                    width: "40px",
                    height: "40px",
                    fontSize: "20px",
                    fontWeight: isOriginalCell(rowIndex, colIndex) ? 'bold' : 'normal',
                    borderTop: rowIndex % 3 === 0 ? "3px solid black" : "1px solid black",
                    borderLeft: colIndex % 3 === 0 ? "3px solid black" : "1px solid black",
                    borderRight: colIndex === 8 ? "3px solid black" : "1px solid black",
                    borderBottom: rowIndex === 8 ? "3px solid black" : "1px solid black",
                  }}
                  readOnly={isOriginalCell(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-center space-x-4">
        <Button variant="contained" color="primary" onClick={generatePuzzle}>
          New Puzzle
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={undoMove}
          disabled={history.length === 0}
        >
          Undo
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => alert("Solve logic to be implemented!")}
        >
          Solve
        </Button>
      </div>
    </div>
  );
};
