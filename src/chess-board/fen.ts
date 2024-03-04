export type Pawn = {
  name: "pawn";
  doubleStep: boolean;
};

export type Knight = {
  name: "knight";
};

export type Bishop = {
  name: "bishop";
};

export type Rook = {
  name: "rook";
};

export type Queen = {
  name: "queen";
};

export type King = {
  name: "king";
  canCastleQueen: boolean;
  canCastleKing: boolean;
};

export type PieceType = Pawn | Knight | Bishop | Rook | Queen | King;

export type Color = "black" | "white";

export type Piece = {
  pieceType: PieceType;
  pieceColor: Color;
};

const pieces = {
  p: {
    pieceType: {
      name: "pawn",
      doubleStep: false,
    } as Pawn,
    pieceColor: "black",
  } as Piece,
  n: {
    pieceType: {
      name: "knight",
    } as Knight,
    pieceColor: "black",
  } as Piece,
  b: {
    pieceType: {
      name: "bishop",
    } as Bishop,
    pieceColor: "black",
  } as Piece,
  r: {
    pieceType: {
      name: "rook",
    } as Rook,
    pieceColor: "black",
  } as Piece,
  q: {
    pieceType: {
      name: "queen",
    } as Queen,
    pieceColor: "black",
  } as Piece,
  k: {
    pieceType: {
      name: "king",
      canCastleQueen: false,
      canCastleKing: false,
    } as King,
    pieceColor: "black",
  } as Piece,
  P: {
    pieceType: {
      name: "pawn",
      doubleStep: false,
    } as Pawn,
    pieceColor: "white",
  } as Piece,
  N: {
    pieceType: {
      name: "knight",
    } as Knight,
    pieceColor: "white",
  } as Piece,
  B: {
    pieceType: {
      name: "bishop",
    } as Bishop,
    pieceColor: "white",
  } as Piece,
  R: {
    pieceType: {
      name: "rook",
    } as Rook,
    pieceColor: "white",
  } as Piece,
  Q: {
    pieceType: {
      name: "queen",
    } as Queen,
    pieceColor: "white",
  } as Piece,
  K: {
    pieceType: {
      name: "king",
      canCastleQueen: false,
      canCastleKing: false,
    } as King,
    pieceColor: "white",
  } as Piece,
};

type PieceLetter =
  | "p"
  | "n"
  | "b"
  | "r"
  | "q"
  | "k"
  | "P"
  | "N"
  | "B"
  | "R"
  | "Q"
  | "K";

export type Square = {
  file: number;
  rank: number;
};

export type PiecePosition = {
  piece: Piece | null;
  square: Square;
};

export type ChessPosition = {
  board: PiecePosition[][];
  turn: Color;
  whiteKingSquare: Square;
  blackKingSquare: Square;
};

export function ParseFEN(fenstring: string) {
  let rank = 8;
  let file = 1;
  let whiteKingSquare: Square = { file: 0, rank: 0 };
  let blackKingSquare: Square = { file: 0, rank: 0 };

  const sections = fenstring.split(" ");

  const ranks: PiecePosition[][] = new Array<PiecePosition[]>(8);
  const currentRank: PiecePosition[] = new Array<PiecePosition>(8);
  for (let index = 0; index < sections[0].length; index++) {
    const current = fenstring[index];
    if (current === "/") {
      ranks[rank - 1] = [...currentRank];
      rank--;
      file = 1;
      continue;
    }
    const number = Number(current);
    if (!Number.isNaN(number)) {
      for (let i = 0; i < number; i++) {
        currentRank[file + i - 1] = {
          square: {
            file: file + i,
            rank,
          },
          piece: null,
        };
      }
      file += number;
      continue;
    }

    const piece = pieces[current as PieceLetter];
    const piecePosition: PiecePosition = {
      piece: {
        pieceColor: piece.pieceColor,
        pieceType: { ...piece.pieceType },
      },
      square: { file, rank },
    };
    if (piece.pieceType.name === "king") {
      if (piece.pieceColor === "white")
        whiteKingSquare = {
          file,
          rank,
        };
      else
        blackKingSquare = {
          file,
          rank,
        };
    }
    currentRank[file - 1] = piecePosition;
    file++;
  }
  ranks[rank - 1] = [...currentRank];

  const turn = sections[1] === "w" ? "white" : "black";

  if (sections[2] !== "-")
    for (let index = 0; index < sections[2].length; index++) {
      const current = sections[2][index] as "q" | "k" | "Q" | "K";
      if (current === "q") {
        const whiteKing = ranks[whiteKingSquare.rank - 1][
          whiteKingSquare.file - 1
        ].piece?.pieceType as King;
        whiteKing.canCastleQueen = true;
      } else if (current === "k") {
        const whiteKing = ranks[whiteKingSquare.rank - 1][
          whiteKingSquare.file - 1
        ].piece?.pieceType as King;
        whiteKing.canCastleKing = true;
      } else if (current === "Q") {
        const blackKing = ranks[blackKingSquare.rank - 1][
          blackKingSquare.file - 1
        ].piece?.pieceType as King;
        blackKing.canCastleQueen = true;
      } else if (current === "K") {
        const blackKing = ranks[blackKingSquare.rank - 1][
          blackKingSquare.file - 1
        ].piece?.pieceType as King;
        blackKing.canCastleQueen = true;
      }
    }

  return {
    board: ranks,
    turn,
    whiteKingSquare,
    blackKingSquare,
  } as ChessPosition;
}
