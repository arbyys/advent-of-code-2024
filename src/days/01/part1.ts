import { Effect, pipe, Schema, Either } from "effect";

const LineSchema = Schema.Array(Schema.NumberFromString);

const parse = (data: string) => {
    const lines = data.trim().split("\n");

    const col1: number[] = [];
    const col2: number[] = [];

    lines.map((line) => {
        const parts = line.trim().split(/\s+/);
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            col1.push(result.right[0]);
            col2.push(result.right[1]);
        } else
            Effect.fail("Syncing failed");
    });

    return [col1, col2];
}

const sortArrays = (array: number[][]): number[][] => {
    return [
        [...array[0]].sort(),
        [...array[1]].sort()
    ]
}

const reduceDistances = (array: number[][]): number => {
    return array[0].reduce((acc, value, index) => {
        return acc + Math.abs(value - array[1][index]);
    }, 0);
    
}

export const part1 = (data: string): Effect.Effect<number, never, never> => {
    const parsedData = parse(data);
    const process = pipe(
        parsedData,
        sortArrays,
        reduceDistances,
        Effect.succeed,
    );
    return process;
}