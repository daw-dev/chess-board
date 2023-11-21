import { useEffect, useState } from "react";
import chessboardStyle from "./ChessBoard.module.css";
import classNames from "classnames";
import { ChessBoard, ChessTile, Color, Square } from "./types";
import _ from "lodash";
import useForceUpdate from "../utils/useForceUpdate";

const defaultPosition =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface ChessBoardCmpProps {
  position?: string;
  view?: Color;
}

export function ChessBoardCmp(props: ChessBoardCmpProps) {
  const fenstring = props.position ?? defaultPosition;
  const [board] = useState(() => ChessBoard.createChessBoard(fenstring));

  const forceUpdate = useForceUpdate();

  const [currentSelectedPosition, setCurrentSelectedPosition] = useState<
    ChessTile | undefined
  >(undefined);

  useEffect(() => {
    const listener = function (ev: KeyboardEvent) {
      if (ev.key === "u" || ev.key === "U") {
        board.undoLastMove();
        forceUpdate();
      }
    };
    listener.bind(window);
    addEventListener("keydown", listener);
    return () => removeEventListener("keydown", listener);
  }, []);

  const selectedLegalMoves =
    currentSelectedPosition && board.getLegalMoves(currentSelectedPosition);

  const className = classNames(
    chessboardStyle.chessboard,
    chessboardStyle[`${props.view ?? board.turn}-view`]
  );

  function onTileClicked(clickedTile: ChessTile) {
    if (
      currentSelectedPosition &&
      selectedLegalMoves?.find((move) =>
        _.isEqual(move.targetSquare, clickedTile.square)
      )
    ) {
      makeMove(clickedTile);
      setCurrentSelectedPosition(undefined);
    } else if (
      clickedTile.piece &&
      clickedTile.piece.pieceColor === board.turn
    ) {
      setCurrentSelectedPosition(clickedTile);
    }
  }

  function makeMove(targetTile: ChessTile) {
    const move = selectedLegalMoves!.find((move) =>
      _.isEqual(move.targetSquare, targetTile.square)
    )!;
    board.makeMove(move, true);
    forceUpdate();
  }

  return (
    <div className={className}>
      {board.tiles.map((rank, rankIndex) => (
        <div className={chessboardStyle.rank} key={rankIndex}>
          {rank.map((piece, pieceIndex) => (
            <ChessTileCmp
              key={pieceIndex}
              chessTile={piece}
              isSelected={currentSelectedPosition === piece}
              isLegal={
                selectedLegalMoves !== undefined &&
                selectedLegalMoves.findIndex((move) =>
                  _.isEqual(move.targetSquare, piece.square)
                ) !== -1
              }
              clickCallback={onTileClicked}
              currentChessPosition={board}
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

  const simple = Square.simplify(chessTile.square);
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
