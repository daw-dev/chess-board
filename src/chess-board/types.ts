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
  public readonly file?: ChessFile;
  public readonly rank?: ChessRank;

  constructor(file?: ChessFile, rank?: ChessRank) {
    this.file = file;
    this.rank = rank;
  }

  public add(fileAdd: number, rankAdd: number) {
    const simple = Square.simplify(this);
    return Square.chessify(simple.file + fileAdd, simple.rank + rankAdd);
  }

  public toString() {
    return `${this.file}${this.rank}`;
  }

  public isValid() {
    return this.file !== undefined && this.rank !== undefined;
  }

  static simplify(square: Square) {
    if (!square.isValid()) return { file: -1, rank: -1 };

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

    return { file: files[square.file!], rank: square.rank! - 1 };
  }

  static chessify(file: number, rank: number): Square {
    if (file < 0 || file >= 8 || rank < 0 || rank >= 8) return new Square();
    const files: ChessFile[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return new Square(files[file], (rank + 1) as ChessRank);
  }
}

export class ChessTile {
  public readonly square: Square;
  public piece: Piece | undefined;

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
  protected checkAndAdd(
    board: ChessBoard,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ) {
    if (!targetSquare.isValid()) return undefined;

    const tile = board.getTile(targetSquare)!;

    if (!tile.piece) {
      const move = new Move(
        board,
        startingSquare,
        targetSquare,
        this,
        false,
        false,
        false
      );
      moves.push(move);

      return move;
    }

    if (tile.piece.pieceColor === this.pieceColor) return undefined;

    const move = new Move(
      board,
      startingSquare,
      targetSquare,
      this,
      true,
      false,
      false,
      tile.piece
    );
    moves.push(move);

    return move;
  }
}

class Pawn extends Piece {
  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "P" : "p";
  }

  public getFileImageName(): string {
    return `${this.pieceColor}_pawn.svg`;
  }

  private checkAndAddDiagonal(
    board: ChessBoard,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ) {
    if (!targetSquare.isValid()) return;

    const piece = board.getTile(targetSquare)!.piece;
    if (!piece) return;

    if (piece.pieceColor === this.pieceColor) return;

    moves.push(
      new Move(
        board,
        startingSquare,
        targetSquare,
        this,
        true,
        false,
        false,
        piece
      )
    );
  }

  protected checkAndAdd(
    board: ChessBoard,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ): Move | undefined {
    if (!targetSquare.isValid()) return undefined;

    const tile = board.getTile(targetSquare)!;

    if (!tile.piece) {
      const move = new Move(
        board,
        startingSquare,
        targetSquare,
        this,
        false,
        false,
        false
      );
      moves.push(move);

      return move;
    }

    return undefined;
  }

  public possibleMoves(board: ChessBoard, startingSquare: Square): Move[] {
    const moves: Move[] = [];
    if (this.pieceColor === "white") {
      if (
        this.checkAndAdd(
          board,
          startingSquare,
          startingSquare.add(0, 1),
          moves
        ) &&
        startingSquare.rank === 2
      ) {
        this.checkAndAdd(
          board,
          startingSquare,
          startingSquare.add(0, 2),
          moves
        );
      }
      this.checkAndAddDiagonal(
        board,
        startingSquare,
        startingSquare.add(1, 1),
        moves
      );
      this.checkAndAddDiagonal(
        board,
        startingSquare,
        startingSquare.add(-1, 1),
        moves
      );
    } else {
      if (
        this.checkAndAdd(
          board,
          startingSquare,
          startingSquare.add(0, -1),
          moves
        ) &&
        startingSquare.rank === 7
      ) {
        this.checkAndAdd(
          board,
          startingSquare,
          startingSquare.add(0, -2),
          moves
        );
      }
      this.checkAndAddDiagonal(
        board,
        startingSquare,
        startingSquare.add(1, -1),
        moves
      );
      this.checkAndAddDiagonal(
        board,
        startingSquare,
        startingSquare.add(-1, -1),
        moves
      );
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
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(0, i), moves);
        if(!newMove || newMove.isCapture)
          topDone = true;
      }
      if (!bottomDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(0, -i), moves);
        if(!newMove || newMove.isCapture)
          bottomDone = true;
      }
      if (!rightDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(i, 0), moves);
        if(!newMove || newMove.isCapture)
          rightDone = true;
      }
      if (!leftDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(-i, 0), moves);
        if(!newMove || newMove.isCapture)
          leftDone = true;
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

    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(1, 2),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-1, 2),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(1, -2),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-1, -2),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(2, 1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(2, -1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-2, 1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-2, -1),
      moves
    );

    return moves;
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
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(i, i), moves);
        if(!newMove || newMove.isCapture)
          topRightDone = true;
      }
      if (!bottomRightDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(i, -i), moves);
        if(!newMove || newMove.isCapture)
          bottomRightDone = true;
      }
      if (!topLeftDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(-i, i), moves);
        if(!newMove || newMove.isCapture)
          topLeftDone = true;
      }
      if (!bottomLeftDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(-i, -i), moves);
        if(!newMove || newMove.isCapture)
          bottomLeftDone = true;
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
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(0, i), moves);
        if(!newMove || newMove.isCapture)
          topDone = true;
      }
      if (!bottomDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(0, -i), moves);
        if(!newMove || newMove.isCapture)
          bottomDone = true;
      }
      if (!rightDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(i, 0), moves);
        if(!newMove || newMove.isCapture)
          rightDone = true;
      }
      if (!leftDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(-i, 0), moves);
        if(!newMove || newMove.isCapture)
          leftDone = true;
      }
      if (!topRightDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(i, i), moves);
        if(!newMove || newMove.isCapture)
          topRightDone = true;
      }
      if (!bottomRightDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(i, -i), moves);
        if(!newMove || newMove.isCapture)
          bottomRightDone = true;
      }
      if (!topLeftDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(-i, i), moves);
        if(!newMove || newMove.isCapture)
          topLeftDone = true;
      }
      if (!bottomLeftDone) {
        const newMove = this.checkAndAdd(board, startingSquare, startingSquare.add(-i, -i), moves);
        if(!newMove || newMove.isCapture)
          bottomLeftDone = true;
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

    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-1, -1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-1, 0),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(-1, 1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(0, -1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(0, 1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(1, -1),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(1, 0),
      moves
    );
    this.checkAndAdd(
      board,
      startingSquare,
      startingSquare.add(1, 1),
      moves
    );

    return moves;
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
  public turn: Color;
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
          currentRank[file + i] = new ChessTile(
            Square.chessify(file + i, rank)
          );
        }
        file += number;
        continue;
      }

      const piece = piecesConstructors[current as PieceLetter]();
      const tile = new ChessTile(Square.chessify(file, rank), piece);
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
    if (!square.isValid()) return undefined;

    const simple = Square.simplify(square);
    return this.tiles[simple.rank][simple.file];
  }

  public getKing(color: Color) {
    return color === "white"
      ? (this.whiteKingPosition.piece as King)
      : (this.blackKingPosition.piece as King);
  }

  public makeMove(move: Move) {
    const targetTile = this.getTile(move.targetSquare)!;
    targetTile.piece = move.movePiece;
    const startingTile = this.getTile(move.startingSquare)!;
    startingTile.piece = undefined;
    this.changeTurn();
  }

  public undoMove(move: Move) {
    const startingTile = this.getTile(move.startingSquare)!;
    startingTile.piece = move.movePiece;
    const targetTile = this.getTile(move.targetSquare)!;
    targetTile.piece = move.capturePiece;
    this.changeTurn();
  }

  private changeTurn(){
    this.turn = this.turn === "white" ? "black" : "white";
  }

  public getLegalMoves(selectedTile: ChessTile) {
    const moves = selectedTile.piece!.possibleMoves(this, selectedTile.square);
    return moves;
  }

  public calculateCheckType(move: Move): CheckType {
    return move.isEnPassant ? "none" : "checkmate";
  }
}
