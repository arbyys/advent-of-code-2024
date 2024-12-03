import { Effect, pipe, Schema, Either } from "effect";

const parse = (data: string) => {
    const lines = data.trim().split("\n").join("");
    const decode = Schema.decodeUnknownEither(Schema.String);
    const result = decode(lines);
    if (Either.isRight(result)) {
        return result.right;
    } else
        Effect.fail("Syncing failed");
    return "";
}

const multiplyAndReduce = (matchedRegex: RegExpExecArray[]): number => {
    return matchedRegex.reduce((result, current) => {
        const decode = Schema.decodeUnknownEither(Schema.NumberFromString);
        const num1 = decode(current[1]);
        const num2 = decode(current[2]);
        if (Either.isRight(num1) && Either.isRight(num2)) {
            return result + num1.right * num2.right;
        }
        return 0;
    }, 0);
}

const extractMuls = (data: string): RegExpExecArray[] => {
    const regexp = /mul\(([0-9]{1,3}),([0-9]{1,3})\)/g;
    return [...data.matchAll(regexp)];
}

function* doDontSliceIterator(input: string, regex: RegExp) {
    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    let lastIndex = 0;

    let match;
    while ((match = globalRegex.exec(input)) !== null) {
        const matchStart = match.index;
        const matchEnd = globalRegex.lastIndex;

        const substring = input.slice(lastIndex, matchStart);
        yield { substring, match: match[0] };
        lastIndex = matchEnd;
    }

    if (lastIndex < input.length) {
        yield { substring: input.slice(lastIndex), match: null };
    }
}

const runWithDoDont = (data: string): number => {
    const regex = /(do\(\)|don't\(\))/g;
    let mulIsEnabled = true;
    let resultInstructions = "";
    for (const { substring, match } of doDontSliceIterator(data, regex)) {
        if (mulIsEnabled) {
            resultInstructions += substring;
            if (match === "don't()") {
                mulIsEnabled = false;
            }
        } else {
            if (match === "do()") {
                mulIsEnabled = true;
            }
        }
    }

    return multiplyAndReduce(extractMuls(resultInstructions));
}

export const part2 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        runWithDoDont,
        Effect.succeed,
    )
}