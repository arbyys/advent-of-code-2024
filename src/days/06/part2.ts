import { Effect, pipe, Schema, Either } from "effect";

const LineSchema = Schema.Array(Schema.String);

type Coords = { row: number, col: number };

type Direction = number[];

type DirectionRecord = Record<string, Direction>;

interface DataPacked {
    startingCoords: Coords,
    rows: string[][]
}

type MoveAtCoordsTimestamp = {coords: Coords, direction: Direction};

const directions: DirectionRecord = {
    "up": [-1, 0],
    "right": [0, 1],
    "down": [1, 0],
    "left": [0, -1],
};

const parse = (data: string): DataPacked => {
    const lines = data.trim().split("\n");

    const rows: string[][] = [];
    const startingCoords = { row: -1, col: -1 };

    lines.map((line, index) => {
        const parts = line.trim().split("");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if (Either.isRight(result)) {
            const search = result.right.indexOf("^");
            if (search >= 0) {
                startingCoords.row = index;
                startingCoords.col = search;
            }

            rows.push([...result.right]);
        } else
            Effect.fail("Syncing failed");
    });

    return { rows, startingCoords };
}

const getDirectionByAngle = (char: string): Direction => {
    switch (char) {
        case "^":
            return directions["up"];
        case ">":
            return directions["right"];
        case "v":
            return directions["down"];
        case "<":
            return directions["left"];
        default:
            return [-1, -1];
    }
}

const moveAngle = (char: string): string => {
    switch (char) {
        case "^":
            return ">";
        case ">":
            return "v";
        case "v":
            return "<";
        case "<":
            return "^";
        default:
            return "";
    }
}

const isInsideGrid = (grid: string[][], coords: Coords): boolean => {
    return (
        (coords.row >= 0 && coords.row < grid.length)
        &&
        (coords.col >= 0 && coords.col < grid[coords.row].length)
    );
}

const stepOrTurn = (grid: string[][], visitedMask: string[][], doneMoves: MoveAtCoordsTimestamp[], position: Coords): {
    grid: string[][],
    visitedMask: string[][],
    doneMoves: MoveAtCoordsTimestamp[],
    movedNotTurned: boolean,
    endOfSimulation: boolean,
    hasBeenCycled: boolean,
} => {
    const currentChar = grid[position.row][position.col];
    const moveVector = getDirectionByAngle(currentChar);

    // if tries to step outside of grid - end of simulation
    if (!isInsideGrid(grid, { row: position.row + moveVector[0], col: position.col + moveVector[1] })) {
        return { grid, visitedMask, doneMoves, movedNotTurned: false, endOfSimulation: true, hasBeenCycled: false };
    }

    // if tures to step in front of seen obstacle - cycled
    if (false) {
        return { grid, visitedMask, doneMoves, movedNotTurned: false, endOfSimulation: false, hasBeenCycled: true };
    }

    // moving now
    const stepForward = grid[position.row + moveVector[0]][position.col + moveVector[1]];

    // can't step forward
    if (stepForward == "#") {
        grid[position.row][position.col] = moveAngle(currentChar);

        return { grid, visitedMask, doneMoves, movedNotTurned: false, endOfSimulation: false, hasBeenCycled: false };
    }
    // air in in front, step forward
    else {
        grid[position.row][position.col] = ".";
        grid[position.row + moveVector[0]][position.col + moveVector[1]] = currentChar;
        visitedMask[position.row + moveVector[0]][position.col + moveVector[1]] = "X";

        return { grid, visitedMask, doneMoves, movedNotTurned: true, endOfSimulation: false, hasBeenCycled: false };
    }
}
const printGrid = (grid: string[][]): string => {
    return grid.map(row => row.join("")).join("\n");
}


const simulate = (data: DataPacked): string[][] => {
    let currentCoords: Coords = data.startingCoords;

    let visitedMask = data.rows.map(row => [...row]);
    let grid = data.rows.map(row => [...row]);
    let doneMoves: MoveAtCoordsTimestamp[] = [];
    let movedNotTurned = true;
    let hasBeenCycled = false;
    let endOfSimulation = false;

    visitedMask[currentCoords.row][currentCoords.col] = "X";

    while (true) {
        const moveVector = getDirectionByAngle(grid[currentCoords.row][currentCoords.col]);

        ({ grid, visitedMask, doneMoves, movedNotTurned, endOfSimulation, hasBeenCycled } = stepOrTurn(grid, visitedMask, doneMoves, currentCoords));

        if (movedNotTurned) {
            currentCoords = {
                row: currentCoords.row + moveVector[0],
                col: currentCoords.col + moveVector[1],
            };
        }

        if (endOfSimulation || hasBeenCycled) {
            break;
        }
    }

    console.log(printGrid(visitedMask));

    return visitedMask;
}

const calculateVisited = (dataVisited: string[][]): number => {
    return dataVisited.reduce((count, row) => {
        return count + row.reduce((rowCount, cell) => rowCount + (cell === "X" ? 1 : 0), 0);
    }, 0);
}

export const part2 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        simulate,
        calculateVisited,
        Effect.succeed,
    );
}