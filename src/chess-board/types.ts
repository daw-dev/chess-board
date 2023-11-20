type Color = "white" | "black";

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

class Square {
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

class ChessTile {
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
  public abstract getSimpleName(): string;
}

class Pawn extends Piece {
  public getSimpleName(): string {
    return this.pieceColor === "white" ? "p" : "P";
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

  public getSimpleName(): string {
    return this.pieceColor === "white" ? "r" : "R";
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
  public getSimpleName(): string {
    return this.pieceColor === "white" ? "n" : "N";
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
  public getSimpleName(): string {
    return this.pieceColor === "white" ? "b" : "B";
  }
}

class Queen extends Piece {
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
  public getSimpleName(): string {
    return this.pieceColor === "white" ? "q" : "Q";
  }
}

class King extends Piece {
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

  public getSimpleName(): string {
    return this.pieceColor === "white" ? "k" : "K";
  }
}

class ChessBoard {
  private squares: ChessTile[][];
  public readonly turn: Color;

  private constructor(squares: ChessTile[][], turn: Color) {
    this.squares = squares;
    this.turn = turn;
  }

  public static createChessBoard(fen: string) {
    console.log(fen);
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
    return this.squares[simple.rank][simple.file];
  }

  public makeMove(move: Move) {
    console.log(move.toString());
  }

  public undoMove(move: Move) {
    console.log(move.toString());
  }

  public calculateCheckType(move: Move): CheckType {
    console.log(move.toString());
    return "none";
  }
}

function simplify(square: Square) {
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

function chessify(file: number, rank: number): Square {
  const files: ChessFile[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return new Square(files[file], (rank + 1) as ChessRank);
}
