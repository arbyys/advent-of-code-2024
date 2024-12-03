import { Effect, pipe, Either, Schema } from "effect";

// The algorithm for part2:

// Since just one correction of bad level is allowed,
// it's only needed to find first occurence of bad level,
// attempt to fix it and try again. Another occurence of bad level
// is unfixable.

// For each bad level it: removes level that caused the error and also the previous one (in case of Direction Change also the penultimate one) and attempts again with each newly created – possible fixed – report.
// O(n)

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

const calcDirection = (num: number, prev: number): number => {
    const difference = (num - prev);
    return (difference == 0 ? 0 : (difference > 0 ? 1 : -1));
}

const findFirstBadDistance = (row: number[]): number => {
    return row.findIndex((element, index, array) => {
        if (index < 1) return false;
        const distance = Math.abs(element - array[index-1]);
        return (distance < 1) || (distance > 3);
    });
}

const findFirstDirectionChange = (row: number[]): number => {
    return row.findIndex((element, index, array) => {
        if (index < 2) return false;
        const lastDirection = calcDirection(array[index-1], element);
        const penultDirection = calcDirection(array[index-2], array[index-1]);
        return lastDirection != penultDirection;
    });
}

const isReportSafe = (row: number[]): boolean => {
    return (findFirstBadDistance(row) == -1) && (findFirstDirectionChange(row) == -1)
}

const checkReportWithOneFix = (row: number[]): boolean => {
    const firstBD = findFirstBadDistance(row);
    const firstDC = findFirstDirectionChange(row);

    if((firstBD == -1) && (firstDC == -1)) {
        return true; // "Safe without removing any level"
    }

    // lowest one which is not -1
    const firstErrorIndex = firstBD !== -1 && (firstDC === -1 || firstBD < firstDC) ? firstBD : firstDC;

    // generate two different reports (each of them has removed one of the two adjacent levels)
    const errorFixAttempt1 = [...row.slice(0, firstErrorIndex), ...row.slice(firstErrorIndex + 1)];
    const errorFixAttempt2 = [...row.slice(0, firstErrorIndex - 1), ...row.slice(firstErrorIndex)];
    // if the found error is direction change, also add third report (removed penultimate level) 
    const errorFixAttempt3Conditional = firstDC == -1 ? false : isReportSafe([...row.slice(0, firstErrorIndex - 2), ...row.slice(firstErrorIndex-1)]);

    // if true: "Safe by removing some level"
    // if false: "Unsafe regardless of which level is removed"
    return isReportSafe(errorFixAttempt1) || isReportSafe(errorFixAttempt2) || errorFixAttempt3Conditional;
}

const findSafeReports = (rows: number[][]): number => {
    const mapped = rows.map((report) => {
        return checkReportWithOneFix(report)
    })
    return mapped.reduce((safeReports, item) => {
        return safeReports + (!!item ? 1 : 0);
    }, 0);
}

export const part2 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        findSafeReports,
        Effect.succeed,
    );
}