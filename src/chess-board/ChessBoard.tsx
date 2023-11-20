import { useState } from "react";
import {
  Color,
  ParseFEN,
  PiecePosition,
  ChessPosition,
  Square,
  Pawn,
} from "./fen";
import chessboardStyle from "./ChessBoard.module.css";
import classNames from "classnames";

const defaultPosition =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface ChessBoardProps {
  position?: string;
  view?: Color;
}

type Move = {
  startPosition: PiecePosition;
  endPosition: PiecePosition;
};

const legalFunctions = {
  pawn(move: Move, board: ChessPosition) {
    if (!move.startPosition.piece) return false;
    const startSquare = move.startPosition.square;
    const endSquare = move.endPosition.square;
    const fileDifference = Math.abs(startSquare.file - endSquare.file);
    if (fileDifference > 1) return false;

    const pieceColor = move.startPosition.piece.pieceColor;
    const rankDifference =
      pieceColor === "white"
        ? endSquare.rank - startSquare.rank
        : startSquare.rank - endSquare.rank;
    if (rankDifference > 2 || rankDifference <= 0) return false;
    if (
      rankDifference === 2 &&
      (startSquare.rank !== (pieceColor === "white" ? 2 : 7) ||
        fileDifference === 1)
    ) {
      return false;
    }

    if (fileDifference === 0) {
      return move.endPosition.piece === null;
    }
    if (move.endPosition.piece !== null) {
      return true;
    }
    const pawnCheckSquare: Square = {
      rank: pieceColor === "white" ? endSquare.rank - 1 : endSquare.rank + 1,
      file: endSquare.file,
    };
    const pawnCheck =
      board.board[pawnCheckSquare.rank - 1][pawnCheckSquare.file - 1].piece;

    if (
      !pawnCheck ||
      pawnCheck.pieceType.name !== "pawn" ||
      pawnCheck.pieceColor === pieceColor
    )
      return false;
    return pawnCheck.pieceType.doubleStep;
  },
  knight(move: Move) {
    const startSquare = move.startPosition.square;
    const endSquare = move.endPosition.square;
    const fileDifference = Math.abs(startSquare.file - endSquare.file);
    const rankDifference = Math.abs(startSquare.rank - endSquare.rank);
    return (
      (fileDifference === 2 && rankDifference === 1) ||
      (fileDifference === 1 && rankDifference === 2)
    );
  },
  bishop(move: Move, board: ChessPosition) {
    const startSquare = move.startPosition.square;
    const endSquare = move.endPosition.square;
    const fileDifference = Math.abs(startSquare.file - endSquare.file);
    const rankDifference = Math.abs(startSquare.rank - endSquare.rank);
    if (fileDifference !== rankDifference) return false;
    const increasingRank = startSquare.rank < endSquare.rank;
    const increasingFile = startSquare.file < endSquare.file;
    for (let i = 1; i < rankDifference; i++) {
      const currentRank = increasingRank
        ? startSquare.rank + i
        : startSquare.rank - i;
      const currentFile = increasingFile
        ? startSquare.file + i
        : startSquare.file - i;
      if (board.board[currentRank - 1][currentFile - 1].piece) return false;
    }
    return true;
  },
  rook(move: Move, board: ChessPosition) {
    const startSquare = move.startPosition.square;
    const endSquare = move.endPosition.square;
    const fileDifference = Math.abs(startSquare.file - endSquare.file);
    const rankDifference = Math.abs(startSquare.rank - endSquare.rank);
    if (fileDifference * rankDifference !== 0) return false;
    if (fileDifference === 0) {
      const increasingRank = startSquare.rank < endSquare.rank;
      for (let i = 1; i < rankDifference; i++) {
        const currentRank = increasingRank
          ? startSquare.rank + i
          : startSquare.rank - i;
        if (board.board[currentRank - 1][startSquare.file - 1].piece)
          return false;
      }
    } else {
      const increasingFile = startSquare.file < endSquare.file;
      for (let i = 1; i < fileDifference; i++) {
        const currentFile = increasingFile
          ? startSquare.file + i
          : startSquare.file - i;
        if (board.board[startSquare.rank - 1][currentFile - 1].piece)
          return false;
      }
    }
    return true;
  },
  queen(move: Move, board: ChessPosition) {
    return this.rook(move, board) || this.bishop(move, board);
  },
  king(move: Move) {
    const startSquare = move.startPosition.square;
    const endSquare = move.endPosition.square;
    const fileDifference = Math.abs(startSquare.file - endSquare.file);
    const rankDifference = Math.abs(startSquare.rank - endSquare.rank);
    return Math.max(fileDifference, rankDifference) === 1;
  },
};

function isInCheck(
  square: Square,
  color: Color,
  chessPosition: ChessPosition
) {
  return false;
}

function isCastles(move: Move, chessPosition: ChessPosition) {
  const startPiece = move.startPosition.piece?.pieceType.name;
  const endPiece = move.endPosition.piece?.pieceType.name;
  if(!(startPiece === "rook" && endPiece === "king" || startPiece === "king" || endPiece === "rook"))
    return false;

  const turn = chessPosition.turn;
  if (turn === "white") {
    return false;
  } else {
    return false;
  }
}

function isLegal(move: Move, chessPosition: ChessPosition) {
  if (!move.startPosition.piece) return false;
  if (
    move.endPosition.piece &&
    move.startPosition.piece.pieceColor === move.endPosition.piece.pieceColor &&
    !isCastles(move, chessPosition)
  )
    return false;

  return legalFunctions[move.startPosition.piece.pieceType.name](
    move,
    chessPosition
  );
}

let lastMove: Move;

export function ChessBoard(props: ChessBoardProps) {
  const fenPosition = props.position ?? defaultPosition;
  const [chessPosition, setChessPosition] = useState(ParseFEN(fenPosition));
  const [currentSelectedPosition, setCurrentSelectedPosition] = useState<
    PiecePosition | undefined
  >(undefined);

  const className = classNames(
    chessboardStyle.chessboard,
    chessboardStyle[`${props.view ?? chessPosition.turn}-view`]
  );

  function onTileClicked(position: PiecePosition) {
    if (currentSelectedPosition) {
      if (currentSelectedPosition.square === position.square) return;

      move({ startPosition: currentSelectedPosition, endPosition: position });
      setCurrentSelectedPosition(undefined);
    } else if (
      position.piece &&
      position.piece.pieceColor === chessPosition.turn
    ) {
      setCurrentSelectedPosition(position);
    }
  }

  function move(move: Move) {
    if (!isLegal(move, chessPosition)) return;

    const { startPosition, endPosition } = move;
    if (
      startPosition.piece?.pieceType.name === "pawn" &&
      Math.abs(startPosition.square.rank - endPosition.square.rank) > 1
    ) {
      startPosition.piece.pieceType.doubleStep = true;
    } else if (
      startPosition.piece?.pieceType.name === "pawn" &&
      startPosition.square.file !== endPosition.square.file &&
      endPosition.piece === null
    ) {
      chessPosition.board[
        endPosition.square.rank +
          (startPosition.piece.pieceColor === "white" ? -1 : 1) -
          1
      ][endPosition.square.file - 1].piece = null;
    }
    endPosition.piece = startPosition.piece;
    startPosition.piece = null;

    if (lastMove && lastMove.endPosition.piece?.pieceType.name === "pawn")
      lastMove.endPosition.piece.pieceType.doubleStep = false;
    lastMove = move;

    setChessPosition((oldPosition) => ({
      ...oldPosition,
      turn: oldPosition.turn === "white" ? "black" : "white",
    }));
  }

  return (
    <div className={className}>
      {chessPosition.board.map((rank, rankIndex) => (
        <div className={chessboardStyle.rank} key={rankIndex}>
          {rank.map((piece, pieceIndex) => (
            <ChessTile
              key={pieceIndex}
              piecePosition={piece}
              selectedPiece={currentSelectedPosition}
              clickCallback={onTileClicked}
              currentChessPosition={chessPosition}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ChessTileProps {
  piecePosition: PiecePosition;
  clickCallback: (position: PiecePosition) => void;
  selectedPiece?: PiecePosition;
  currentChessPosition: ChessPosition;
}

function ChessTile(props: ChessTileProps) {
  const { piecePosition, clickCallback, selectedPiece, currentChessPosition } =
    props;

  const even = (piecePosition.square.file + piecePosition.square.rank) % 2 == 0;

  const className = classNames(
    chessboardStyle.chesstile,
    even ? chessboardStyle.even : chessboardStyle.odd,
    piecePosition.piece && chessboardStyle.piece
  );

  const img = piecePosition.piece && (
    <img
      src={`src/assets/pieces/${piecePosition.piece.pieceColor}_${piecePosition.piece.pieceType.name}.svg`}
      draggable={false}
    />
  );

  return (
    <span className={className} onClick={() => clickCallback(piecePosition)}>
      {img}
      {selectedPiece &&
        isLegal(
          { startPosition: selectedPiece, endPosition: piecePosition },
          currentChessPosition
        ) && <span className={chessboardStyle.legalmove} />}
    </span>
  );
}
