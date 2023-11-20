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
  protected pieceColor: Color;

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
      if (!board.getSquare(startingSquare.add(0, 1))?.piece) {
        moves.push(new Move(board, startingSquare, startingSquare.add(0, 1), this, false, false, false))
        if (
          startingSquare.rank === 2 &&
          !board.getSquare(startingSquare.add(0, 2))?.piece
        ) {
          moves.push(new Move(board, startingSquare, startingSquare.add(0, 2), this, false, false, false));
        }
      }
      const rightPiece = board.getSquare(startingSquare.add(1, 1))?.piece;
      if(rightPiece){
        moves.push(new Move(board, startingSquare, startingSquare.add(1, 1), this, false, false, false, rightPiece));
      }
      const leftPiece = board.getSquare(startingSquare.add(-1, 1))?.piece;
      if(board.getSquare(startingSquare.add(-1, 1))?.piece){
        moves.push(new Move(board, startingSquare, startingSquare.add(-1, 1), this, false, false, false, leftPiece));
      }
    }
    else {
      if (!board.getSquare(startingSquare.add(0, -1))?.piece) {
        moves.push(new Move(board, startingSquare, startingSquare.add(0, -1), this, false, false, false))
        if (
          startingSquare.rank === 2 &&
          !board.getSquare(startingSquare.add(0, -2))?.piece
        ) {
          moves.push(new Move(board, startingSquare, startingSquare.add(0, -2), this, false, false, false));
        }
      }
      const rightPiece = board.getSquare(startingSquare.add(1, -1))?.piece;
      if(board.getSquare(startingSquare.add(1, -1))?.piece){
        moves.push(new Move(board, startingSquare, startingSquare.add(1, -1), this, false, false, false, rightPiece));
      }
      const leftPiece = board.getSquare(startingSquare.add(-1, -1))?.piece;
      if(board.getSquare(startingSquare.add(-1, -1))?.piece){
        moves.push(new Move(board, startingSquare, startingSquare.add(-1, -1), this, false, false, false, leftPiece));
      }
    }

    return moves;
  }
}

class ChessBoard {
  private squares: ChessTile[][];
  private turn: Color;

  private constructor(squares: ChessTile[][], turn: Color) {
    this.squares = squares;
    this.turn = turn;
  }

  public static createChessBoard(fen: string) {}

  public getSquare(square: Square) {
    const simple = simplify(square);
    if(simple.file < 0 || simple.file >= 8 || simple.rank < 0 || simple.rank >= 8)
      return undefined;
    return this.squares[simple.rank][simple.file];
  }

  public makeMove(move: Move){

  }

  public undoMove(move: Move){

  }

  public calculateCheckType(move: Move) : CheckType {
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
