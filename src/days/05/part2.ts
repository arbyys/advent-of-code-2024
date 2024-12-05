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
        if (Either.isRight(result)) {
            orderingRules.push({ left: result.right[0], right: result.right[1] });
        } else
            Effect.fail("Syncing failed");
    });

    secondPart.map((line) => {
        const parts = line.trim().split(",");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if (Either.isRight(result)) {
            updates.push([...result.right]);
        } else
            Effect.fail("Syncing failed");

    })

    return { orderingRules, updates };
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

const testRulesOnUpdate = (
    update: number[],
    rules: NumberOrderingRule[]
): boolean => {
    return update.map((updateVal, index, array) => {
        const toLeft = array.slice(0, index);
        const toRight = array.slice(index + 1);

        return testRulesOnVal(updateVal, toLeft, toRight, rules);
    }).reduce((validations, current) => validations + (current ? 0 : 1), 0) == 0;
}

const tryToFixUpdate = (uncorrect: number[], rules: NumberOrderingRule[]): number[] => {
    let workingUpdate = [...uncorrect];

    rules.forEach(rule => {
        const indexL = workingUpdate.findIndex(v => v == rule.left);
        const indexR = workingUpdate.findIndex(v => v == rule.right);
        if (indexL > indexR) {
            // swap indexes
            const temp = workingUpdate[indexL];
            workingUpdate[indexL] = workingUpdate[indexR];
            workingUpdate[indexR] = temp;
        }
    });
    
    return workingUpdate;
}

const process = (data: DataPacked): number => {
    const result = data.updates.reduce((middleNumberSum, currentUpdate) => {

        const relevantRules = data.orderingRules.filter((el) => {
            const vals = [el.left, el.right];
            return vals.every(v => currentUpdate.includes(v));
        });

        const isValid = testRulesOnUpdate(currentUpdate, relevantRules);

        // rule violation found => find the fix and add it's middle number to the total count
        if (!isValid) {
            let fixed = [...currentUpdate];
            do {
                fixed = tryToFixUpdate(fixed, relevantRules);
            } while (!testRulesOnUpdate(fixed, relevantRules));

            const currentMiddleNumber = fixed[Math.round((fixed.length - 1) / 2)];
            return middleNumberSum + currentMiddleNumber;
        }
        // no rule violations found => keep the total count
        return middleNumberSum;
    }, 0);
    return result;
}

export const part2 = (data: string): Effect.Effect<number, never, never> => {
    return pipe(
        parse(data),
        process,
        Effect.succeed,
    );
}