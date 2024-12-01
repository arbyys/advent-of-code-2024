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
        if (Either.isRight(result)) {
            col1.push(result.right[0]);
            col2.push(result.right[1]);
        } else
            Effect.fail("Syncing failed");
    });

    return [col1, col2];
}

const reduceSimilarities = (array: number[][]): number => {
    const precomputed = array[1].reduce<Record<number, number>>((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    const res = array[0].reduce((acc, value) => {
        return acc + (value * (!!precomputed[value] ? precomputed[value] : 0));
    }, 0);
    return res;

}

export const part2 = (data: string): Effect.Effect<number, never, never> => {
    const parsedData = parse(data);
    const process = pipe(
        parsedData,
        reduceSimilarities,
        Effect.succeed,
    );
    return process;
}