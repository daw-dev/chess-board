export type Color = "white" | "black";

type ChessFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type ChessRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type CheckType = "none" | "check" | "checkmate";

class Move {
  public readonly startingSquare: Square;
  public readonly targetSquare: Square;
  public readonly movePiece: Piece;
  public readonly isCapture: boolean;
  public readonly isEnPassant: boolean;
  public readonly isCastles: boolean;
  public readonly capturePiece: Piece | undefined;
  public readonly checkType: CheckType;

  constructor(
    board: ChessBoard,
    startingSquare: Square,
    targetSquare: Square,
    movePiece: Piece,
    isCapture: boolean,
    isEnpassant: boolean,
    isCastles: boolean,
    capturePiece?: Piece
  ) {
    this.startingSquare = startingSquare;
    this.targetSquare = targetSquare;
    this.movePiece = movePiece;
    this.isCapture = isCapture;
    this.isEnPassant = isEnpassant;
    this.isCastles = isCastles;
    this.capturePiece = capturePiece;
    this.checkType = board.calculateCheckType(this);
  }

  public toString() {
    if (this.isCastles) {
      return this.targetSquare.file === "a" ? "O-O-O" : "O-O";
    }

    return `${this.movePiece.getSimpleName()}${
      this.isCapture ? "x" : ""
    }${this.targetSquare.toString()}${
      this.checkType === "check"
        ? "+"
        : this.checkType === "checkmate"
        ? "#"
        : ""
    }`;
  }
}

export class Square {
  public readonly file: ChessFile;
  public readonly rank: ChessRank;

  constructor(file: ChessFile, rank: ChessRank) {
    this.file = file;
    this.rank = rank;
  }

  public add(fileAdd: number, rankAdd: number) {
    const simple = simplify(this);
    return chessify(simple.file + fileAdd, simple.rank + rankAdd);
  }

  public toString() {
    return `${this.file}${this.rank}`;
  }
}

export class ChessTile {
  public readonly square: Square;
  public readonly piece: Piece | undefined;

  public constructor(square: Square, piece?: Piece) {
    this.square = square;
    this.piece = piece;
  }
}

abstract class Piece {
  public readonly pieceColor: Color;

  public constructor(pieceColor: Color) {
    this.pieceColor = pieceColor;
  }

  public abstract possibleMoves(
    board: ChessBoard,
    startingSquare: Square
  ): Move[];
  public abstract getSimpleName(): PieceLetter;
  public abstract getFileImageName(): string;
}

class Pawn extends Piece {
  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "P" : "p";
  }

  public getFileImageName(): string {
    return `${this.pieceColor}_pawn.svg`;
  }

  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];
    if (this.pieceColor === "white") {
      if (!board.getTile(startingSquare.add(0, 1))?.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            startingSquare.add(0, 1),
            this,
            false,
            false,
            false
          )
        );
        if (
          startingSquare.rank === 2 &&
          !board.getTile(startingSquare.add(0, 2))?.piece
        ) {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(0, 2),
              this,
              false,
              false,
              false
            )
          );
        }
      }
      const rightPiece = board.getTile(startingSquare.add(1, 1))?.piece;
      if (rightPiece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            startingSquare.add(1, 1),
            this,
            false,
            false,
            false,
            rightPiece
          )
        );
      }
      const leftPiece = board.getTile(startingSquare.add(-1, 1))?.piece;
      if (board.getTile(startingSquare.add(-1, 1))?.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            startingSquare.add(-1, 1),
            this,
            false,
            false,
            false,
            leftPiece
          )
        );
      }
    } else {
      if (!board.getTile(startingSquare.add(0, -1))?.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            startingSquare.add(0, -1),
            this,
            false,
            false,
            false
          )
        );
        if (
          startingSquare.rank === 2 &&
          !board.getTile(startingSquare.add(0, -2))?.piece
        ) {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(0, -2),
              this,
              false,
              false,
              false
            )
          );
        }
      }
      const rightPiece = board.getTile(startingSquare.add(1, -1))?.piece;
      if (board.getTile(startingSquare.add(1, -1))?.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            startingSquare.add(1, -1),
            this,
            false,
            false,
            false,
            rightPiece
          )
        );
      }
      const leftPiece = board.getTile(startingSquare.add(-1, -1))?.piece;
      if (board.getTile(startingSquare.add(-1, -1))?.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            startingSquare.add(-1, -1),
            this,
            false,
            false,
            false,
            leftPiece
          )
        );
      }
    }

    // TODO: en passant

    return moves;
  }
}

class Rook extends Piece {
  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];
    let topDone = false,
      bottomDone = false,
      rightDone = false,
      leftDone = false;
    for (let i = 1; i < 8; i++) {
      if (!topDone) {
        const top = board.getTile(startingSquare.add(0, i));
        if (top && top.piece) {
          if (top.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(0, i),
                this,
                true,
                false,
                false,
                top.piece
              )
            );
          }

          topDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(0, i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!bottomDone) {
        const bottom = board.getTile(startingSquare.add(0, -i));
        if (bottom && bottom.piece) {
          if (bottom.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(0, -i),
                this,
                true,
                false,
                false,
                bottom.piece
              )
            );
          }

          bottomDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(0, -i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!rightDone) {
        const right = board.getTile(startingSquare.add(i, 0));
        if (right && right.piece) {
          if (right.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(i, 0),
                this,
                true,
                false,
                false,
                right.piece
              )
            );
          }

          rightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(i, 0),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!leftDone) {
        const left = board.getTile(startingSquare.add(-i, 0));
        if (left && left.piece) {
          if (left.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(-i, 0),
                this,
                true,
                false,
                false,
                left.piece
              )
            );
          }

          topDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(-i, 0),
              this,
              true,
              false,
              false
            )
          );
        }
      }
    }

    //TODO: castles

    return moves;
  }

  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "R" : "r";
  }

  public getFileImageName(): string {
    return `${this.pieceColor}_rook.svg`;
  }
}

class Knight extends Piece {
  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];

    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(1, 2),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-1, 2),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(1, -2),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-1, -2),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(2, 1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(2, -1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-2, 1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-2, -1),
      moves
    );

    return moves;
  }

  checkAndAddMove(
    board: ChessBoard,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ) {
    const current = board.getTile(startingSquare.add(1, 2));
    if (current) {
      if (!current.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            targetSquare,
            this,
            false,
            false,
            false
          )
        );
      } else {
        moves.push(
          new Move(
            board,
            startingSquare,
            targetSquare,
            this,
            true,
            false,
            false,
            current.piece
          )
        );
      }
    }
  }
  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "N" : "n";
  }
  public getFileImageName(): string {
    return `${this.pieceColor}_knight.svg`;
  }
}

class Bishop extends Piece {
  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];
    let topRightDone = false,
      bottomLeftDone = false,
      bottomRightDone = false,
      topLeftDone = false;
    for (let i = 1; i < 8; i++) {
      if (!topRightDone) {
        const top = board.getTile(startingSquare.add(i, i));
        if (top && top.piece) {
          if (top.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(i, i),
                this,
                true,
                false,
                false,
                top.piece
              )
            );
          }

          topRightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(i, i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!bottomLeftDone) {
        const bottom = board.getTile(startingSquare.add(-i, -i));
        if (bottom && bottom.piece) {
          if (bottom.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(-i, -i),
                this,
                true,
                false,
                false,
                bottom.piece
              )
            );
          }

          bottomLeftDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(-i, -i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!bottomRightDone) {
        const right = board.getTile(startingSquare.add(i, -i));
        if (right && right.piece) {
          if (right.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(i, -i),
                this,
                true,
                false,
                false,
                right.piece
              )
            );
          }

          bottomRightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(i, -i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!topLeftDone) {
        const left = board.getTile(startingSquare.add(-i, i));
        if (left && left.piece) {
          if (left.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(-i, i),
                this,
                true,
                false,
                false,
                left.piece
              )
            );
          }

          topRightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(-i, i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
    }

    return moves;
  }
  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "B" : "b";
  }

  public getFileImageName(): string {
    return `${this.pieceColor}_bishop.svg`;
  }
}

class Queen extends Piece {
  public getFileImageName(): string {
    return `${this.pieceColor}_queen.svg`;
  }
  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];
    let topDone = false,
      bottomDone = false,
      rightDone = false,
      leftDone = false,
      topRightDone = false,
      bottomLeftDone = false,
      bottomRightDone = false,
      topLeftDone = false;
    for (let i = 1; i < 8; i++) {
      if (!topDone) {
        const top = board.getTile(startingSquare.add(0, i));
        if (top && top.piece) {
          if (top.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(0, i),
                this,
                true,
                false,
                false,
                top.piece
              )
            );
          }

          topDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(0, i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!bottomDone) {
        const bottom = board.getTile(startingSquare.add(0, -i));
        if (bottom && bottom.piece) {
          if (bottom.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(0, -i),
                this,
                true,
                false,
                false,
                bottom.piece
              )
            );
          }

          bottomDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(0, -i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!rightDone) {
        const right = board.getTile(startingSquare.add(i, 0));
        if (right && right.piece) {
          if (right.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(i, 0),
                this,
                true,
                false,
                false,
                right.piece
              )
            );
          }

          rightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(i, 0),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!leftDone) {
        const left = board.getTile(startingSquare.add(-i, 0));
        if (left && left.piece) {
          if (left.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(-i, 0),
                this,
                true,
                false,
                false,
                left.piece
              )
            );
          }

          topDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(-i, 0),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!topRightDone) {
        const top = board.getTile(startingSquare.add(i, i));
        if (top && top.piece) {
          if (top.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(i, i),
                this,
                true,
                false,
                false,
                top.piece
              )
            );
          }

          topRightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(i, i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!bottomLeftDone) {
        const bottom = board.getTile(startingSquare.add(-i, -i));
        if (bottom && bottom.piece) {
          if (bottom.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(-i, -i),
                this,
                true,
                false,
                false,
                bottom.piece
              )
            );
          }

          bottomLeftDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(-i, -i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!bottomRightDone) {
        const right = board.getTile(startingSquare.add(i, -i));
        if (right && right.piece) {
          if (right.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(i, -i),
                this,
                true,
                false,
                false,
                right.piece
              )
            );
          }

          bottomRightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(i, -i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
      if (!topLeftDone) {
        const left = board.getTile(startingSquare.add(-i, i));
        if (left && left.piece) {
          if (left.piece.pieceColor !== this.pieceColor) {
            moves.push(
              new Move(
                board,
                startingSquare,
                startingSquare.add(-i, i),
                this,
                true,
                false,
                false,
                left.piece
              )
            );
          }

          topRightDone = true;
        } else {
          moves.push(
            new Move(
              board,
              startingSquare,
              startingSquare.add(-i, i),
              this,
              true,
              false,
              false
            )
          );
        }
      }
    }

    return moves;
  }
  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "Q" : "q";
  }
}

export class King extends Piece {
  public canCastleKing: boolean = false;
  public canCastleQueen: boolean = false;

  public getFileImageName(): string {
    return `${this.pieceColor}_king.svg`;
  }
  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];

    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-1, -1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-1, 0),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(-1, 1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(0, -1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(0, 1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(1, -1),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(1, 0),
      moves
    );
    this.checkAndAddMove(
      board,
      startingSquare,
      startingSquare.add(1, 1),
      moves
    );

    return moves;
  }

  checkAndAddMove(
    board: ChessBoard,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ) {
    const current = board.getTile(startingSquare.add(1, 2));
    if (current) {
      if (!current.piece) {
        moves.push(
          new Move(
            board,
            startingSquare,
            targetSquare,
            this,
            false,
            false,
            false
          )
        );
      } else {
        moves.push(
          new Move(
            board,
            startingSquare,
            targetSquare,
            this,
            true,
            false,
            false,
            current.piece
          )
        );
      }
    }
  }

  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "K" : "k";
  }
}

const piecesConstructors = {
  p: () => new Pawn("black"),
  n: () => new Knight("black"),
  b: () => new Bishop("black"),
  r: () => new Rook("black"),
  q: () => new Queen("black"),
  k: () => new King("black"),
  P: () => new Pawn("white"),
  N: () => new Knight("white"),
  B: () => new Bishop("white"),
  R: () => new Rook("white"),
  Q: () => new Queen("white"),
  K: () => new King("white"),
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

export class ChessBoard {
  public readonly tiles: ChessTile[][];
  public readonly turn: Color;
  public readonly whiteKingPosition: ChessTile;
  public readonly blackKingPosition: ChessTile;

  private constructor(
    tiles: ChessTile[][],
    turn: Color,
    whiteKingPosition: ChessTile,
    blackKingPosition: ChessTile
  ) {
    this.tiles = tiles;
    this.turn = turn;
    this.whiteKingPosition = whiteKingPosition;
    this.blackKingPosition = blackKingPosition;
  }

  public static createChessBoard(fenstring: string) {
    let rank = 7;
    let file = 0;

    let whiteKingPosition!: ChessTile;
    let blackKingPosition!: ChessTile;

    const sections = fenstring.split(" ");

    const ranks: ChessTile[][] = new Array<ChessTile[]>(8);
    const currentRank: ChessTile[] = new Array<ChessTile>(8);
    for (let index = 0; index < sections[0].length; index++) {
      const current = fenstring[index];
      if (current === "/") {
        ranks[rank] = [...currentRank];
        rank--;
        file = 0;
        continue;
      }
      const number = Number(current);
      if (!Number.isNaN(number)) {
        for (let i = 0; i < number; i++) {
          currentRank[file + i] = new ChessTile(chessify(file + i, rank));
        }
        file += number;
        continue;
      }

      const piece = piecesConstructors[current as PieceLetter]();
      const tile = new ChessTile(chessify(file, rank), piece);
      currentRank[file] = tile;
      if (current === "K") whiteKingPosition = tile;
      else if (current === "k") blackKingPosition = tile;
      file++;
    }
    ranks[rank] = [...currentRank];

    const turn = sections[1] === "w" ? "white" : "black";

    if (sections[2] !== "-") {
      const blackKing = blackKingPosition.piece as King;
      const whiteKing = whiteKingPosition.piece as King;
      for (let index = 0; index < sections[2].length; index++) {
        const current = sections[2][index] as "q" | "k" | "Q" | "K";
        if (current === "q") {
          blackKing.canCastleQueen = true;
        } else if (current === "k") {
          blackKing.canCastleKing = true;
        } else if (current === "Q") {
          whiteKing.canCastleQueen = true;
        } else if (current === "K") {
          whiteKing.canCastleKing = true;
        }
      }
    }

    return new ChessBoard(ranks, turn, whiteKingPosition, blackKingPosition);
  }

  public getTile(square: Square) {
    const simple = simplify(square);
    if (
      simple.file < 0 ||
      simple.file >= 8 ||
      simple.rank < 0 ||
      simple.rank >= 8
    )
      return undefined;
    return this.tiles[simple.rank][simple.file];
  }

  public getKing(color: Color){
    return color === "white" ? this.whiteKingPosition.piece as King : this.blackKingPosition.piece as King;
  }

  public makeMove(move: Move) {
    console.log(move.toString());
  }

  public undoMove(move: Move) {
    console.log(move.toString());
  }

  public getLegalMoves(selectedTile: ChessTile) {
    return selectedTile.piece ? selectedTile.piece.possibleMoves(this, selectedTile.square) : [];
  }

  public calculateCheckType(move: Move): CheckType {
    return move.isEnPassant ? "none" : "checkmate";
  }
}

export function simplify(square: Square) {
  const files = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
  };

  return { file: files[square.file], rank: square.rank - 1 };
}

export function chessify(file: number, rank: number): Square {
  const files: ChessFile[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return new Square(files[file], (rank + 1) as ChessRank);
}
