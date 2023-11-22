import { createRef, useEffect, useState } from "react";
import chessboardStyle from "./ChessBoard.module.css";
import classNames from "classnames";
import { CheckType, ChessBoard, ChessTile, Color, King, Square } from "./types";
import _ from "lodash";
import useForceUpdate from "../utils/useForceUpdate";

const defaultPosition =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface ChessBoardCmpProps {
  position?: string;
  view?: Color;
}

type CheckState = {
  white: CheckType;
  black: CheckType;
};

export function ChessBoardCmp(props: ChessBoardCmpProps) {
  const fenstring = props.position ?? defaultPosition;
  const [board] = useState(() => ChessBoard.createChessBoard(fenstring));

  const [checks, setChecks] = useState<CheckState>({
    white: "none",
    black: "none",
  });

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
    board.makeMove(move);
    const checkType = move.checkType;
    if (checkType === "stalemate" || checkType === "nomaterial") {
      setChecks({ white: checkType, black: checkType });
    } else {
      const newChecks = {} as CheckState;
      newChecks[board.turn] = checkType;
      newChecks[ChessBoard.other(board.turn)] = "none";
      setChecks(newChecks);
    }
  }

  return (
    <div className={className}>
      {board.tiles.flat().map((tile) => (
        <ChessTileCmp
          key={tile.square.toString()}
          chessTile={tile}
          isSelected={
            currentSelectedPosition === tile &&
            selectedLegalMoves !== undefined &&
            selectedLegalMoves.length > 0
          }
          isLegal={
            selectedLegalMoves !== undefined &&
            selectedLegalMoves.some((move) =>
              _.isEqual(move.targetSquare, tile.square)
            )
          }
          clickCallback={onTileClicked}
          currentChessPosition={board}
          checks={checks}
        />
      ))}
    </div>
  );
}

const symbols = {
  nomaterial: "½",
  stalemate: "½",
  checkmate: "#",
};

interface ChessTileCmpProps {
  chessTile: ChessTile;
  clickCallback: (position: ChessTile) => void;
  isSelected: boolean;
  isLegal: boolean;
  currentChessPosition: ChessBoard;
  checks: { white: CheckType; black: CheckType };
}

function ChessTileCmp(props: ChessTileCmpProps) {
  const { chessTile, clickCallback, isSelected, isLegal, checks } = props;

  const simple = Square.simplify(chessTile.square);
  const even = (simple.file + simple.rank) % 2 == 0;

  const isKing =
    chessTile.piece !== undefined && chessTile.piece instanceof King;

  const checkType = isKing ? checks[chessTile.piece!.pieceColor] : "none";

  const className = classNames(
    chessboardStyle.chesstile,
    even ? chessboardStyle.even : chessboardStyle.odd,
    chessTile.piece && chessboardStyle.piece,
    isSelected && chessboardStyle.selected,
    chessTile.piece && chessboardStyle[chessTile.piece.pieceColor],
    isLegal && chessboardStyle.legalmove,
    isKing && chessboardStyle[checkType]
  );

  const imageRef = createRef<HTMLImageElement>();

  return (
    <span
      className={className}
      onClick={() => clickCallback(chessTile)}
      onDragStart={(evt) => {
        clickCallback(chessTile);
        evt.dataTransfer.setDragImage(imageRef.current!, 22.5, 22.5);
      }}
      onDragEnd={(evt) => {
        console.log("drag end");
        evt.preventDefault();
        if (!isSelected) return;
        clickCallback(chessTile);
      }}
      style={{ gridColumn: simple.file + 1, gridRow: 9 - simple.rank }}
      draggable
    >
      {chessTile.piece && (
        <img
          ref={imageRef}
          src={`pieces/${chessTile.piece.getFileImageName()}`}
          draggable={false}
        />
      )}
      {isLegal && <span className={chessboardStyle.legalmove} />}
      {checkType !== "none" && checkType !== "check" && (
        <span className={chessboardStyle.symbol}>
          <span className={chessboardStyle.text}>{symbols[checkType]}</span>
        </span>
      )}
    </span>
  );
}
