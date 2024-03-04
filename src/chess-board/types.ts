export type Color = "white" | "black";

type ChessFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type ChessRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type CheckType =
  | "none"
  | "check"
  | "checkmate"
  | "stalemate"
  | "nomaterial";

class Move {
  public readonly startingSquare: Square;
  public readonly targetSquare: Square;
  public readonly movePiece: Piece;
  public readonly isCapture: boolean;
  public readonly isEnPassant: boolean;
  public readonly isCastles: boolean;
  public readonly isDoubleStep: boolean;
  public readonly cancelQueensideCastles: boolean;
  public readonly cancelKingsideCastles: boolean;
  public readonly capturePiece: Piece | undefined;
  public readonly checkType: CheckType;

  constructor(
    board: ChessBoard,
    checkCalculation: boolean,
    castleCalculation: boolean,
    startingSquare: Square,
    targetSquare: Square,
    movePiece: Piece,
    isCapture: boolean,
    isEnpassant: boolean,
    isCastles: boolean,
    isDoubleStep: boolean,
    capturePiece?: Piece
  ) {
    this.startingSquare = startingSquare;
    this.targetSquare = targetSquare;
    this.movePiece = movePiece;
    this.isCapture = isCapture;
    this.isEnPassant = isEnpassant;
    this.isCastles = isCastles;
    this.isDoubleStep = isDoubleStep;
    this.cancelQueensideCastles = castleCalculation && this.cancelsCastlesQueenside(board);
    this.cancelKingsideCastles = castleCalculation && this.cancelsCastlesKingside(board);
    this.capturePiece = capturePiece;
    this.checkType = checkCalculation ? board.calculateCheckType(this) : "none";
  }

  public toString() {
    if (this.isCastles) {
      return this.targetSquare.file === "a" ? "O-O-O" : "O-O";
    }

    return `${this.movePiece.getSimpleName()}${this.isCapture ? "x" : ""}${
      this.targetSquare
    }${
      this.checkType === "check"
        ? "+"
        : this.checkType === "checkmate"
        ? "#"
        : ""
    }`;
  }

  private cancelsCastlesKingside(board: ChessBoard) {
    return this.movePiece instanceof King || this.movePiece instanceof Rook;
  }

  private cancelsCastlesQueenside(board: ChessBoard) {
    return this.movePiece instanceof King || this.movePiece instanceof Rook;
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
    startingSquare: Square,
    checkCalculation: boolean,
    castleCalculation: boolean
  ): Move[];
  public abstract getSimpleName(): PieceLetter;
  public abstract getFileImageName(): string;
  protected checkAndAdd(
    board: ChessBoard,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ) {
    if (!targetSquare.isValid()) return undefined;

    const tile = board.getTile(targetSquare)!;

    if (!tile.piece) {
      const move = new Move(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        targetSquare,
        this,
        false,
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
      checkCalculation,
      castleCalculation,
      startingSquare,
      targetSquare,
      this,
      true,
      false,
      false,
      false,
      tile.piece
    );
    moves.push(move);

    return move;
  }
}

class Pawn extends Piece {
  public doubleStep: boolean = false;

  public getSimpleName(): PieceLetter {
    return this.pieceColor === "white" ? "P" : "p";
  }

  public getFileImageName(): string {
    return `${this.pieceColor}_pawn.svg`;
  }

  private checkAndAddDiagonal(
    board: ChessBoard,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ) {
    if (!targetSquare.isValid()) return;

    const piece = board.getTile(targetSquare)!.piece;
    if (piece) {
      if (piece.pieceColor === this.pieceColor) return;

      moves.push(
        new Move(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          targetSquare,
          this,
          true,
          false,
          false,
          false,
          piece
        )
      );
      return;
    }

    if (this.pieceColor === "white") {
      if (startingSquare.rank !== 5) return;

      const checkSquare = targetSquare.add(0, -1);
      const checkTile = board.getTile(checkSquare)!;
      if (!checkTile.piece || !(checkTile.piece instanceof Pawn)) return;

      const pawn = checkTile.piece as Pawn;
      if (pawn.doubleStep) {
        moves.push(
          new Move(
            board,
            checkCalculation,
            castleCalculation,
            startingSquare,
            targetSquare,
            this,
            true,
            true,
            false,
            false,
            pawn
          )
        );
      }
    } else {
      if (startingSquare.rank !== 4) return;

      const checkSquare = targetSquare.add(0, 1);
      const checkTile = board.getTile(checkSquare)!;
      if (!checkTile.piece || checkTile.piece instanceof Pawn) return;

      const pawn = checkTile.piece as Pawn;
      if (pawn.doubleStep) {
        moves.push(
          new Move(
            board,
            checkCalculation,
            castleCalculation,
            startingSquare,
            targetSquare,
            this,
            true,
            true,
            false,
            false,
            pawn
          )
        );
      }
    }
  }

  protected checkAndAdd(
    board: ChessBoard,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true,
    startingSquare: Square,
    targetSquare: Square,
    moves: Move[]
  ): Move | undefined {
    if (!targetSquare.isValid()) return undefined;

    const tile = board.getTile(targetSquare)!;

    if (!tile.piece) {
      const move = new Move(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        targetSquare,
        this,
        false,
        false,
        false,
        Math.abs(targetSquare.rank! - startingSquare.rank!) > 1
      );
      moves.push(move);

      return move;
    }

    return undefined;
  }

  public possibleMoves(
    board: ChessBoard,
    startingSquare: Square,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true
  ): Move[] {
    const moves: Move[] = [];
    if (this.pieceColor === "white") {
      if (
        this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, 1),
          moves
        ) &&
        startingSquare.rank === 2
      ) {
        this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, 2),
          moves
        );
      }
      this.checkAndAddDiagonal(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        startingSquare.add(1, 1),
        moves
      );
      this.checkAndAddDiagonal(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        startingSquare.add(-1, 1),
        moves
      );
    } else {
      if (
        this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, -1),
          moves
        ) &&
        startingSquare.rank === 7
      ) {
        this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, -2),
          moves
        );
      }
      this.checkAndAddDiagonal(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        startingSquare.add(1, -1),
        moves
      );
      this.checkAndAddDiagonal(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        startingSquare.add(-1, -1),
        moves
      );
    }

    return moves;
  }
}

class Rook extends Piece {
  public possibleMoves(
    board: ChessBoard,
    startingSquare: Square,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true
  ): Move[] {
    const moves: Move[] = [];
    let topDone = false,
      bottomDone = false,
      rightDone = false,
      leftDone = false;
    for (let i = 1; i < 8; i++) {
      if (!topDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, i),
          moves
        );
        if (!newMove || newMove.isCapture) topDone = true;
      }
      if (!bottomDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, -i),
          moves
        );
        if (!newMove || newMove.isCapture) bottomDone = true;
      }
      if (!rightDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(i, 0),
          moves
        );
        if (!newMove || newMove.isCapture) rightDone = true;
      }
      if (!leftDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(-i, 0),
          moves
        );
        if (!newMove || newMove.isCapture) leftDone = true;
      }
    }

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
  public possibleMoves(
    board: ChessBoard,
    startingSquare: Square,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true
  ): Move[] {
    const moves: Move[] = [];

    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(1, 2),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(-1, 2),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(1, -2),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(-1, -2),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(2, 1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(2, -1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(-2, 1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
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
  public possibleMoves(
    board: ChessBoard,
    startingSquare: Square,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true
  ): Move[] {
    const moves: Move[] = [];
    let topRightDone = false,
      bottomLeftDone = false,
      bottomRightDone = false,
      topLeftDone = false;
    for (let i = 1; i < 8; i++) {
      if (!topRightDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(i, i),
          moves
        );
        if (!newMove || newMove.isCapture) topRightDone = true;
      }
      if (!bottomRightDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(i, -i),
          moves
        );
        if (!newMove || newMove.isCapture) bottomRightDone = true;
      }
      if (!topLeftDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(-i, i),
          moves
        );
        if (!newMove || newMove.isCapture) topLeftDone = true;
      }
      if (!bottomLeftDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(-i, -i),
          moves
        );
        if (!newMove || newMove.isCapture) bottomLeftDone = true;
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
  public possibleMoves(
    board: ChessBoard,
    startingSquare: Square,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true
  ): Move[] {
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
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, i),
          moves
        );
        if (!newMove || newMove.isCapture) topDone = true;
      }
      if (!bottomDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(0, -i),
          moves
        );
        if (!newMove || newMove.isCapture) bottomDone = true;
      }
      if (!rightDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(i, 0),
          moves
        );
        if (!newMove || newMove.isCapture) rightDone = true;
      }
      if (!leftDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(-i, 0),
          moves
        );
        if (!newMove || newMove.isCapture) leftDone = true;
      }
      if (!topRightDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(i, i),
          moves
        );
        if (!newMove || newMove.isCapture) topRightDone = true;
      }
      if (!bottomRightDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(i, -i),
          moves
        );
        if (!newMove || newMove.isCapture) bottomRightDone = true;
      }
      if (!topLeftDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(-i, i),
          moves
        );
        if (!newMove || newMove.isCapture) topLeftDone = true;
      }
      if (!bottomLeftDone) {
        const newMove = this.checkAndAdd(
          board,
          checkCalculation,
          castleCalculation,
          startingSquare,
          startingSquare.add(-i, -i),
          moves
        );
        if (!newMove || newMove.isCapture) bottomLeftDone = true;
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
  public possibleMoves(
    board: ChessBoard,
    startingSquare: Square,
    checkCalculation: boolean = true,
    castleCalculation: boolean = true
  ): Move[] {
    const moves: Move[] = [];

    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(-1, -1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(-1, 0),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(-1, 1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(0, -1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(0, 1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(1, -1),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(1, 0),
      moves
    );
    this.checkAndAdd(
      board,
      checkCalculation,
      castleCalculation,
      startingSquare,
      startingSquare.add(1, 1),
      moves
    );

    this.checkAndAddKingSide(board, startingSquare, moves, checkCalculation, castleCalculation);
    this.checkAndAddQueenSide(board, startingSquare, moves, checkCalculation, castleCalculation);

    return moves;
  }

  private checkAndAddQueenSide(
    board: ChessBoard,
    startingSquare: Square,
    moves: Move[],
    checkCalculation: boolean,
    castleCalculation: boolean
  ) {
    if (!this.canCastleQueen) return;

    for (let file = -1; file >= -3; file--) {
      const tile = board.getTile(startingSquare.add(file, 0));
      if (tile!.piece) return;
    }

    moves.push(
      new Move(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        startingSquare.add(-2, 0),
        this,
        false,
        false,
        true,
        false
      )
    );
  }
  private checkAndAddKingSide(
    board: ChessBoard,
    startingSquare: Square,
    moves: Move[],
    checkCalculation: boolean,
    castleCalculation: boolean
  ) {
    if (!this.canCastleKing) return;

    for (let file = 1; file <= 2; file++) {
      const tile = board.getTile(startingSquare.add(file, 0));
      if (tile!.piece) return;
    }

    moves.push(
      new Move(
        board,
        checkCalculation,
        castleCalculation,
        startingSquare,
        startingSquare.add(2, 0),
        this,
        false,
        false,
        true,
        false
      )
    );
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
  public whiteKingTile: ChessTile;
  public blackKingTile: ChessTile;

  private constructor(
    tiles: ChessTile[][],
    turn: Color,
    whiteKingPosition: ChessTile,
    blackKingPosition: ChessTile
  ) {
    this.tiles = tiles;
    this.turn = turn;
    this.whiteKingTile = whiteKingPosition;
    this.blackKingTile = blackKingPosition;
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

    if (sections[3] !== "-") {
      const file = Number(sections[3]);
      const rank = turn === "white" ? 4 : 5;
      const pawn = ranks[rank][file].piece as Pawn;
      pawn.doubleStep = true;
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
      ? (this.whiteKingTile.piece as King)
      : (this.blackKingTile.piece as King);
  }

  public readonly history: Move[] = [];

  public makeMove(move: Move) {
    const targetTile = this.getTile(move.targetSquare)!;
    targetTile.piece = move.movePiece;
    const startingTile = this.getTile(move.startingSquare)!;
    startingTile.piece = undefined;

    if (move.isDoubleStep) {
      const pawn = move.movePiece as Pawn;
      pawn.doubleStep = true;
    }
    const lastMove = this.history[this.history.length - 1];
    if (lastMove && lastMove.isDoubleStep) {
      (lastMove.movePiece as Pawn).doubleStep = false;
    }
    if (move.isEnPassant) {
      const capturedPawnSquare =
        this.turn === "white"
          ? move.targetSquare.add(0, -1)
          : move.targetSquare.add(0, 1);

      this.getTile(capturedPawnSquare)!.piece = undefined;
    }

    if (move.movePiece instanceof King) {
      if (this.turn === "white") {
        this.whiteKingTile = targetTile;
      } else {
        this.blackKingTile = targetTile;
      }
    }

    if (move.cancelQueensideCastles) {
      this.getKing(this.turn).canCastleQueen = false;
    }
    if (move.cancelKingsideCastles) {
      this.getKing(this.turn).canCastleKing = false;
      console.log("canceled kingside castles");
    }

    if (move.isCastles) {
      const targetFile = move.targetSquare.file!;
      if (targetFile == "c") {
        const rookStartTile = this.getTile(move.startingSquare.add(-4, 0))!;
        const rookEndTile = this.getTile(move.startingSquare.add(-1, 0))!;
        rookEndTile.piece = rookStartTile.piece;
        rookStartTile.piece = undefined;
      } else {
        const rookStartTile = this.getTile(move.startingSquare.add(3, 0))!;
        const rookEndTile = this.getTile(move.startingSquare.add(1, 0))!;
        rookEndTile.piece = rookStartTile.piece;
        rookStartTile.piece = undefined;
      }
    }

    this.changeTurn();
    this.history.push(move);
  }

  public undoLastMove() {
    const lastMove = this.history.pop();
    if (!lastMove) return;

    this.undoMove(lastMove);
  }

  public undoMove(move: Move) {
    if (move.isEnPassant) {
      const startingTile = this.getTile(move.startingSquare)!;
      startingTile.piece = move.movePiece;
      const targetTile = this.getTile(move.targetSquare)!;
      targetTile.piece = undefined;
      const capturedPawnSquare =
        this.turn === "white"
          ? move.targetSquare.add(0, 1)
          : move.targetSquare.add(0, -1);

      this.getTile(capturedPawnSquare)!.piece = move.capturePiece;
    } else {
      const startingTile = this.getTile(move.startingSquare)!;
      startingTile.piece = move.movePiece;
      const targetTile = this.getTile(move.targetSquare)!;
      targetTile.piece = move.capturePiece;
      if (move.movePiece instanceof King) {
        if (this.turn === "white") {
          this.blackKingTile = startingTile;
        } else {
          this.whiteKingTile = startingTile;
        }
      }

      if (move.cancelQueensideCastles) {
        this.getKing(this.turn).canCastleQueen = true;
      }
      if (move.cancelKingsideCastles) {
        this.getKing(this.turn).canCastleKing = true;
      }

      if (move.isCastles) {
        const targetFile = move.targetSquare.file!;
        if (targetFile == "c") {
          const rookStartTile = this.getTile(move.startingSquare.add(-4, 0))!;
          const rookEndTile = this.getTile(move.startingSquare.add(-1, 0))!;
          rookStartTile.piece = rookEndTile.piece;
          rookEndTile.piece = undefined;
        } else {
          const rookStartTile = this.getTile(move.startingSquare.add(3, 0))!;
          const rookEndTile = this.getTile(move.startingSquare.add(1, 0))!;
          rookStartTile.piece = rookEndTile.piece;
          rookEndTile.piece = undefined;
        }
      }
    }

    if (move.isDoubleStep) {
      const pawn = move.movePiece as Pawn;
      pawn.doubleStep = false;
    }
    const lastMove = this.history[this.history.length - 1];
    if (lastMove && lastMove.isDoubleStep) {
      (lastMove.movePiece as Pawn).doubleStep = true;
    }

    this.changeTurn();
  }

  public static other(turn: Color): Color {
    return turn === "white" ? "black" : "white";
  }

  private changeTurn() {
    this.turn = ChessBoard.other(this.turn);
  }

  public getLegalMoves(
    selectedTile: ChessTile,
    checkCalculation: boolean = true,
    illegalCalculation: boolean = true,
    castleCalculation: boolean = true
  ) {
    const moves = selectedTile.piece!.possibleMoves(
      this,
      selectedTile.square,
      checkCalculation,
      castleCalculation
    );
    if (!illegalCalculation) return moves;

    return moves.filter((move) => {
      this.makeMove(move);

      this.changeTurn();
      const isInCheck = this.isInCheck();
      this.changeTurn();

      this.undoLastMove();

      return !isInCheck;
    });
  }

  public getAllPieceTiles() {
    const pieceTiles: ChessTile[] = [];
    for (let simpleRank = 0; simpleRank < 8; simpleRank++) {
      for (let simpleFile = 0; simpleFile < 8; simpleFile++) {
        const tile = this.tiles[simpleRank][simpleFile];

        if (!tile.piece) continue;

        pieceTiles.push(tile);
      }
    }
    return pieceTiles;
  }

  public getAllLegalMoves(
    checkCalculation: boolean = true,
    illegalCalculation: boolean = true,
    castleCalculation: boolean = true
  ) {
    const moves: Move[] = [];
    this.getAllPieceTiles()
      .filter((tile) => tile.piece!.pieceColor === this.turn)
      .forEach((tile) => {
        moves.push(
          ...this.getLegalMoves(tile, checkCalculation, illegalCalculation, castleCalculation)
        );
      });

    return moves;
  }

  private isInCheck() {
    this.changeTurn();
    const isCheck = this.getAllLegalMoves(false, false).some(
      (move) => move.capturePiece instanceof King
    );
    this.changeTurn();
    return isCheck;
  }

  public calculateCheckType(move: Move): CheckType {
    this.makeMove(move);

    console.log(move.toString());
    const isMate = this.getAllLegalMoves(false, true, false).length === 0;
    const isCheck = this.isInCheck();
    const noMat = !this.getAllPieceTiles().some(
      (tile) => !(tile.piece instanceof King)
    );

    this.undoLastMove();

    if (noMat) return "nomaterial";
    if (isCheck && isMate) return "checkmate";
    if (isCheck && !isMate) return "check";
    if (!isCheck && isMate) return "stalemate";
    return "none";
  }
}
