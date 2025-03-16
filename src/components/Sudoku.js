import React, { useState, useEffect, useCallback } from "react";
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
  const backendURL = "http://127.0.0.1:5000"; // Replace if your backend is hosted elsewhere

  const generatePuzzle = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendURL}/generate?difficulty=${difficulty}`);
      setBoard(response.data.board);
      setOriginalBoard(response.data.board);
      setInvalidCells(new Set());
      setHistory([]);
      setHasInvalidMove(false);
    } catch (error) {
      console.error("Error generating puzzle:", error);
      // Optionally handle error display to the user
    } finally {
      setLoading(false);
    }
  }, [difficulty, backendURL]);

  useEffect(() => {
    generatePuzzle();
  }, [difficulty, generatePuzzle]);

  useEffect(() => {
    if (hasInvalidMove) {
      const timer = setTimeout(() => {
        setBlinkInvalid(false);
      }, 500);
      setBlinkInvalid(true);
      return () => clearTimeout(timer);
    } else {
      setBlinkInvalid(false);
    }
  }, [hasInvalidMove]);

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

      // Re-evaluate if there are any invalid moves on the entire board
      let hasAnyInvalidMove = false;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (board[i][j] !== 0 && !isValidMove(i, j, board[i][j], board)) {
            hasAnyInvalidMove = true;
            break;
          }
        }
        if (hasAnyInvalidMove) break;
      }
      setHasInvalidMove(hasAnyInvalidMove);
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

  const solveSudoku = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendURL}/solve`, { board });
      setBoard(response.data.solution);
      // Optionally disable input after solving
    } catch (error) {
      console.error("Error solving Sudoku:", error);
      // Optionally handle error display to the user (e.g., "No solution found")
    } finally {
      setLoading(false);
    }
  };

  const getCellStyle = (rowIndex, colIndex) => {
    const isInvalid = invalidCells.has(`${rowIndex}-${colIndex}`);
    const baseBorder = '1px solid black';
    const thickBorder = '3px solid black';

    return {
      textAlign: "center",
      width: "40px",
      height: "40px",
      fontSize: "20px",
      fontWeight: isOriginalCell(rowIndex, colIndex) ? 'bold' : 'normal',
      borderTop: rowIndex % 3 === 0 ? thickBorder : baseBorder,
      borderLeft: colIndex % 3 === 0 ? thickBorder : baseBorder,
      borderRight: colIndex === 8 ? thickBorder : baseBorder,
      borderBottom: rowIndex === 8 ? thickBorder : baseBorder,
      // Removed borderColor and borderWidth for invalid cells from here
      color: isInvalid ? 'red' : 'inherit',
      backgroundColor: isInvalid ? 'rgba(255, 0, 0, 0.1)' : isOriginalCell(rowIndex, colIndex) ? 'bg-gray-100' : 'white',
    };
  };

  const getInputClassName = (rowIndex, colIndex) => {
    const isInvalid = invalidCells.has(`${rowIndex}-${colIndex}`);
    return `w-12 h-12 text-center text-lg font-bold border ${
      isInvalid ? 'border-red-500' : 'border-gray-400'
    } ${isInvalid && blinkInvalid ? 'text-red-500' : ''} ${
      isOriginalCell(rowIndex, colIndex) ? 'bg-gray-100' : 'bg-white'
    }`;
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
                  className={getInputClassName(rowIndex, colIndex)}
                  style={getCellStyle(rowIndex, colIndex)}
                  readOnly={isOriginalCell(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex w-full max-w-md">
        <Button className="flex-grow mr-2" variant="contained" color="primary" onClick={generatePuzzle}>
          New Puzzle
        </Button>
        <Button className="flex-grow mx-2" variant="contained" color="success" onClick={solveSudoku}>
          Solve
        </Button>
        <Button className="flex-grow ml-2" variant="contained" color="warning" onClick={undoMove} disabled={history.length === 0}>
          Undo
        </Button>
      </div>
    </div>
  );
};

export default Sudoku;