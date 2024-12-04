import { Effect, pipe, Schema, Either } from "effect";

const LineSchema = Schema.Array(Schema.Char);

const parse = (data: string) => {
    const lines = data.trim().split("\n");

    const rows: string[][] = [];

    lines.map((line) => {
        const parts = line.trim().split("");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            rows.push([...result.right]);
        } else
            Effect.fail("Syncing failed");
    });

    return rows;
}

const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
    [-1, -1], // left up
    [-1, 1], // right up
    [1, -1], // left down
    [1, 1], // right down
];

const searchInDirection = (
    grid: string[][],
    word: string,
    row: number,
    col: number,
    direction: number[]
): boolean => {
    for (let i = 0; i < word.length; i++) {
        const newRow = row + i * direction[0];
        const newCol = col + i * direction[1];

        if (newRow < 0 || newRow >= grid.length ||
            newCol < 0 || newCol >= grid[0].length ||
            grid[newRow][newCol] !== word[i]
        ) return false;
    }
    return true;
};

const countOccurences = (grid: string[][]): number => {
    const word = "XMAS";
    return grid.reduce((totalCount, row, rowIndex) =>
        totalCount + row.reduce((rowCount, _, colIndex) =>
            rowCount + directions.reduce((directionCount, direction) =>
                directionCount + (searchInDirection(grid, word, rowIndex, colIndex, direction) ? 1 : 0)
            , 0)
        , 0)
    , 0);
};


export const part1 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        countOccurences,
        Effect.succeed,
    );
}