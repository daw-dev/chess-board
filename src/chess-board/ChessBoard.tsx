import { useState } from "react";
import chessboardStyle from "./ChessBoard.module.css";
import classNames from "classnames";
import { ChessBoard, ChessTile, Color, simplify } from "./types";
import _ from "lodash";

const defaultPosition =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface ChessBoardCmpProps {
  position?: string;
  view?: Color;
}

export function ChessBoardCmp(props: ChessBoardCmpProps) {
  const fenstring = props.position ?? defaultPosition;
  const [chessPosition, setChessPosition] = useState(
    ChessBoard.createChessBoard(fenstring)
  );

  const [currentSelectedPosition, setCurrentSelectedPosition] = useState<
    ChessTile | undefined
  >(undefined);

  const selectedLegalMoves =
    currentSelectedPosition &&
    chessPosition.getLegalMoves(currentSelectedPosition);

  const className = classNames(
    chessboardStyle.chessboard,
    chessboardStyle[`${props.view ?? chessPosition.turn}-view`]
  );

  function onTileClicked(clickedTile: ChessTile) {
    if (currentSelectedPosition) {
      if (
        selectedLegalMoves?.find(
          (move) => _.isEqual(move.targetSquare, clickedTile.square)
        )
      ) {
        // move({ startPosition: currentSelectedPosition, endPosition: position });
        setCurrentSelectedPosition(undefined);
      } else {
        setCurrentSelectedPosition(clickedTile);
      }
    } else if (
      clickedTile.piece &&
      clickedTile.piece.pieceColor === chessPosition.turn
    ) {
      setCurrentSelectedPosition(clickedTile);
    }
  }

  return (
    <div className={className}>
      {chessPosition.tiles.map((rank, rankIndex) => (
        <div className={chessboardStyle.rank} key={rankIndex}>
          {rank.map((piece, pieceIndex) => (
            <ChessTileCmp
              key={pieceIndex}
              chessTile={piece}
              isSelected={currentSelectedPosition === piece}
              isLegal={
                selectedLegalMoves !== undefined &&
                selectedLegalMoves.findIndex(
                  (move) => _.isEqual(move.targetSquare, piece.square)
                ) !== -1
              }
              clickCallback={onTileClicked}
              currentChessPosition={chessPosition}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ChessTileCmpProps {
  chessTile: ChessTile;
  clickCallback: (position: ChessTile) => void;
  isSelected: boolean;
  isLegal: boolean;
  currentChessPosition: ChessBoard;
}

function ChessTileCmp(props: ChessTileCmpProps) {
  const { chessTile, clickCallback, isSelected, isLegal } = props;

  const simple = simplify(chessTile.square);
  const even = (simple.file + simple.rank) % 2 == 0;

  const className = classNames(
    chessboardStyle.chesstile,
    even ? chessboardStyle.even : chessboardStyle.odd,
    chessTile.piece && chessboardStyle.piece,
    isSelected && chessboardStyle.selected
  );

  const img = chessTile.piece && (
    <img
      src={`pieces/${chessTile.piece.getFileImageName()}`}
      draggable={false}
    />
  );

  return (
    <span className={className} onClick={() => clickCallback(chessTile)}>
      {img}
      {isLegal && <span className={chessboardStyle.legalmove} />}
    </span>
  );
}
