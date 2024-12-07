import { Effect, pipe, Schema, Either } from "effect";

const NumberSchema = Schema.NumberFromString;
const StringSchema = Schema.String;

type Operator = "+" | "*" | "||";

const parse = (data: string): number[][] => {
    const lines = data.trim().split("\n");

    let rows: number[][] = [];

    lines.map((line) => {
        const parts = line.trim().split(": ");
        const decodeNumber = Schema.decodeUnknownEither(NumberSchema);
        const decodeString = Schema.decodeUnknownEither(StringSchema);

        const resultKey = decodeNumber(parts[0]);
        const resultIndexString = decodeString(parts[1]);
        if (Either.isRight(resultKey) && Either.isRight(resultIndexString)) {
            const array = resultIndexString.right.split(" ");

            const resultIndex = array
                .map((i) => decodeNumber(i))
                .filter(Either.isRight)
                .map((e) => e.right);

            rows.push([resultKey.right, ...resultIndex]);
        } else
            Effect.fail("Syncing failed");
    });

    return rows;
}

const solveArrayEquation = (equation: Array<number | Operator>, mustBeEqualTo: number): boolean => {
    let latest = BigInt(0);
    equation.every((num2, idx, arr) => {
        const lastElement = arr[idx-1];
        
        // break early if already exceeded target value
        if (latest > mustBeEqualTo) return false;

        // continue on first element or odd elements (it's the inserted operators)
        if (lastElement === undefined || idx % 2 == 1 ) return true;

        const operator = lastElement as Operator;
        const num1 = arr[idx-2] as number;
            
        if (typeof num2 === "number") {
            const result = (operator == "+") ? (num1 + num2) : ((operator == "*") ? (num1 * num2) : Number(`${num1}${num2}`));
            latest = BigInt(result);
            arr[idx] = result;
        }
        return true;
    });

    return latest == BigInt(mustBeEqualTo);
}

const checkAllPermutations = (arr: number[], leftSide: number): boolean => {
    const n = arr.length - 1;
    const permutations = 3 ** n;

    for (let i = 0; i < permutations; i++) {
        const expression: (number | Operator)[] = [];
        let temp = i;

        arr.forEach((num, idx) => {
            expression.push(num);
            if (idx < n) {
                const operatorIndex = temp % 3;
                temp = Math.floor(temp / 3);
                expression.push(operatorIndex === 0 ? "+" : operatorIndex === 1 ? "*" : "||");
            }
        });
        if (solveArrayEquation(expression, leftSide)) {
            return true;
        };
    }
    return false;
};

const process = (rows: number[][]): number => {
    const max = rows.length;

    return rows.map((item, idx) => {
        console.log(">", idx, "/", max-1);
        const numberKey = item[0];
        const value = item.slice(1);
        const result = checkAllPermutations(value, numberKey);

        if(result) return numberKey;
        return 0;
    }).reduce((item, total) => (total + item), 0);
}

export const part2 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        process,
        Effect.succeed,
    );
}