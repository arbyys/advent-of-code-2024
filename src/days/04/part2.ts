import { Effect, pipe, Schema, Either } from "effect";

const LineSchema = Schema.Array(Schema.Char);
type DirectionKey = string;
type DirectionValue = [number, number];

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

const directions: Record<DirectionKey, DirectionValue> = {
    "up": [-1, 0],
    "down": [1, 0],
    "left": [0, -1],
    "right": [0, 1],
    "left_up": [-1, -1],
    "right_up": [-1, 1],
    "left_down": [1, -1],
    "right_down": [1, 1],
};

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
    const searchedWords = ["AM", "AS"];

    return grid.reduce((totalXmasCount, row, rowIndex) => {
        return totalXmasCount + row.reduce((rowXmasCount, _, colIndex) => {
            if(grid[rowIndex][colIndex] != 'A') return rowXmasCount

            const wordsFound = searchedWords.reduce((validCounter, word) => {
                const left_up = searchInDirection(grid, word, rowIndex, colIndex, directions["left_up"]);
                const left_down = searchInDirection(grid, word, rowIndex, colIndex, directions["left_down"]);
                const right_up = searchInDirection(grid, word, rowIndex, colIndex, directions["right_up"]);
                const right_down = searchInDirection(grid, word, rowIndex, colIndex, directions["right_down"]);

                const wordFound = 
                ((left_up && right_down) || (right_up && left_down))
                ? false
                : ((([left_up, left_down, right_up, right_down].reduce((acum, el) => acum + (el ? 1 : 0), 0))) == 2);

                return validCounter + (wordFound ? 1 : 0);

            }, 0) == 2;

            return rowXmasCount + (wordsFound ? 1 : 0);
        }, 0)
    }, 0);
};


export const part2 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        countOccurences,
        Effect.succeed,
    );
}