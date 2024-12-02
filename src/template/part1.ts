import { Effect, pipe, Schema } from "effect";

const parse = (data: string) => {
    const lines = data.trim().split("\n");

    /*const col1: number[] = [];

    lines.map((line) => {
        const parts = line.trim().split(/\s+/);
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            col1.push(result.right[0]);
        } else
            Effect.fail("Syncing failed");
    });

    */
    return lines;
}

export const part1 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        Effect.succeed,
    );
}