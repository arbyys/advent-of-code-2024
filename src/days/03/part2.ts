import { Effect, pipe, Schema, Either } from "effect";

const parse = (data: string) => {
    const lines = data.trim().split("\n").join("");
    const decode = Schema.decodeUnknownEither(Schema.String);
    const result = decode(lines);
    if(Either.isRight(result)) {
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
        if(Either.isRight(num1) && Either.isRight(num2)) {
            return result + num1.right * num2.right;
        } else
            return 0;
    }, 0);
}

const applyRegex = (data: string): RegExpExecArray[] => {
    const regexp = /mul\(([0-9]{1,3}),([0-9]{1,3})\)/g;
    const array = [...data.matchAll(regexp)];
    return array;
}

export const part1 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        applyRegex,
        multiplyAndReduce,
        Effect.succeed,
    )
}