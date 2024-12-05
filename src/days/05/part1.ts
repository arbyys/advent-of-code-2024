import { Effect, pipe, Schema, Either } from "effect";

interface NumberOrderingRule {
    left: number;
    right: number;
}

interface DataPacked {
    orderingRules: NumberOrderingRule[],
    updates: number[][]
}

const LineSchema = Schema.Array(Schema.NumberFromString);

const parse = (data: string): DataPacked => {
    const parts = data.split("\r\n\r\n");
    const firstPart = parts[0].split("\r\n");
    const secondPart = parts[1].split("\r\n");

    const orderingRules: NumberOrderingRule[] = [];
    const updates: number[][] = [];

    firstPart.map((line) => {
        const parts = line.trim().split("|");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            orderingRules.push({left: result.right[0], right: result.right[1]});
        } else
            Effect.fail("Syncing failed");
    });

    secondPart.map((line) => {
        const parts = line.trim().split(",");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            updates.push([...result.right]);
        } else
            Effect.fail("Syncing failed");

    })

    return {orderingRules, updates};
}

const testRulesOnVal = (
    val: number, 
    toLeft: number[], 
    toRight: number[], 
    rules: NumberOrderingRule[]
) => {
    return rules.reduce((violations, rule) => {
        if (rule.left == val) {
            return violations + (toRight.includes(rule.right) ? 0 : 1);
        } else if (rule.right == val) {
            return violations + (toLeft.includes(rule.left) ? 0 : 1);
        }
        return violations;
    }, 0) == 0;
}

const process = (data: DataPacked): number => {
    const result = data.updates.reduce((middleNumberSum, currentUpdate) => {

        const relevantRules = data.orderingRules.filter((el) => {
            const vals = [el.left, el.right];
            return vals.every(v => currentUpdate.includes(v));
        });

        const validUpdatesMapped = currentUpdate.map((updateVal, index, array) => {
            const toLeft = array.slice(0, index);
            const toRight = array.slice(index + 1);
            
            return testRulesOnVal(updateVal, toLeft, toRight, relevantRules);
        });

        // no rule violations found => add middle number to total count
        if (validUpdatesMapped.every(u => u)) {
            const currentMiddleNumber = currentUpdate[Math.round((currentUpdate.length - 1) / 2)];
            return middleNumberSum + currentMiddleNumber;
        }
        // rule violations found => keep the total count
        return middleNumberSum;
    }, 0);
    return result;
}

export const part1 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        process,
        Effect.succeed,
    );
}