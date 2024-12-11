import { Effect, pipe, Schema, Either } from "effect";

const parse = (data: string) => {
    const lines = data.trim().split("");

    let disks: number[] = [];

    lines.map((line) => {
        const decode = Schema.decodeUnknownEither(Schema.NumberFromString);

        const result = decode(line);
        if (Either.isRight(result)) {
            disks.push(result.right);
        } else
            Effect.fail("Syncing failed");
    });
    return disks;
}

class DiskMap extends Array<number | null> {
    constructor(arr: (number | null)[]) {
        super();
        this.push(...arr);
    }

    fillFirstEmpty(id: number): boolean {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === null) {
                this[i] = id;
                return true;
            }
        }
        return false;
    }

    popLastId(): number | null {
        let last;
        do {
            last = this.pop();
        } while (last === null);
        return !!last ? last : null;
    }

    hasSomeEmpty(): boolean {
        return this.some(item => item === null);
    }

    getItems(): (number | null)[] {
        return [...this];
    }
}

const printData = (data: (number | null)[]): void => {
    console.log('\n' + data.map(item => item === null ? "." : item ).join(""));
}

const constructDiskMapArray = (dataRaw: number[]): (number | null)[] => {
    let currentId = 0;
    const result: (number | null)[] = [];

    dataRaw.forEach((currentNumber, idx) => {
        const fillValue = idx % 2 === 0 ? currentId : null;
        if (idx % 2 === 0) currentId++;
        for (let i = 0; i < currentNumber; i++) {
            result.push(fillValue);
        }
    });

    //console.log("r:", result);
    return result;
}

const calculateChecksum = (data: number[]): bigint => {
    return data.reduce((checksum: bigint, id: number, idx) => {
        if (idx%20==0)console.log(checksum, BigInt(id) * BigInt(idx));
        return checksum + BigInt(id) * BigInt(idx);
    }, BigInt(0));
}

const process = (data: number[]): number[] => {
    const diskMapArray = constructDiskMapArray(data);

    const diskMap = new DiskMap(diskMapArray);
    console.log("Start");

    let iterNum = 0;

    while(true) {
        //console.log("Current iter:", iterNum, diskMap.getItems());
        const id = diskMap.popLastId();
        if (!id) break;
        if (!!id && !diskMap.hasSomeEmpty()) { diskMap.push(id); break; }
        diskMap.fillFirstEmpty(id);
        iterNum += 1;
    }

    console.log("END", diskMap.getItems())

    return diskMap.getItems() as number[];
}

export const part1 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        process,
        calculateChecksum,
        Effect.succeed,
    );
}