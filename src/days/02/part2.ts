import { Effect, pipe, Either, Schema } from "effect";

const LineSchema = Schema.Array(Schema.NumberFromString);

const parse = (data: string) => {
    const lines = data.trim().split("\n");

    const rows: number[][] = [];

    lines.map((line) => {
        const parts = line.trim().split(" ");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            rows.push([...result.right]);
        } else
            Effect.fail("Syncing failed");
    });

    return rows;
}

const reportIsSafe = (row: number[]): boolean => {
    const directionChanges = row.map((number, index) => {
        const prev = index > 0 ? row[index - 1] : null;
        if (!prev) return prev;

        return (number - prev) > 0;
    });

    const unsafeLevels = row.reduce((unsafeLevels, curr, index) => {
        const prev = index > 0 ? row[index - 1] : null;
        if (!prev) {
            return unsafeLevels;
        }
        const distance = Math.abs(curr-prev);
        return unsafeLevels + ((distance >= 1 && distance <= 3) ? 0 : 1);
    }, 0);
    
    return directionChanges.every( i => i === null || i === directionChanges[1]) && unsafeLevels == 0;
}

const reduceReports = (rows: number[][]): number => {
    const mapped = rows.map((report) => {
        return reportIsSafe(report)
    })
    return mapped.reduce((safeReports, item) => {
        return safeReports + (!!item ? 1 : 0);
    }, 0);
}

export const part2 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        reduceReports,
        Effect.succeed,
    );
}