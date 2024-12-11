import { Effect, pipe, Schema, Either } from "effect";

interface DataPacked {
    array: (number | null)[],
    lastId: number
}

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

    tryInsertFile(id: number, originalIndex: number, length: number): boolean {
        let count = 0;
        let foundIndex = -1;

        for (let i = 0; i < this.length; i++) {
            if(i>originalIndex) break;
            if (this[i] === null) {
                count++;
                if (count === length) {
                    foundIndex = i - length + 1;
                    break;
                }
            } else {
                count = 0;
            }
        }
        
        if (foundIndex == -1) return false;

        for (let i = foundIndex; i < foundIndex + length; i++) {
            this[i] = id;
        }
        return true;
    }

    getFileLengthAndIndex(id: number): {length: number | undefined, indexes: number[]} {
        let count = 0;
        let indexes = [];

        for (let i = 0; i < this.length; i++) {
            if (this[i] === id) {
                count++;
                indexes.push(i);
            }
        }

        return {length: (count > 0 ? count : undefined), indexes: indexes};
    }

    hasSomeEmpty(): boolean {
        return this.some(item => item === null);
    }

    getItems(): (number | null)[] {
        return [...this];
    }
}

const printData = (data: (number | null)[]): void => {
    console.log(data.map(item => item === null ? "." : item).join(""));
}

const constructDiskMapArray = (dataRaw: number[]): DataPacked => {
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
    return { array: result, lastId: currentId };
}

const calculateChecksum = (data: (number | null)[]): bigint => {
    return data.reduce((checksum: bigint, id: number | null, idx) => {
        if (id === null) return checksum;
        //if (idx % 20 == 0) console.log(checksum, BigInt(id) * BigInt(idx));
        return checksum + BigInt(id) * BigInt(idx);
    }, BigInt(0));
}

const process = (data: number[]): (number | null)[] => {
    const { array, lastId } = constructDiskMapArray(data);

    const diskMap = new DiskMap(array);
    console.log("Start");
    //printData(array);

    let currentFileToMove = lastId-1;

    while (true) {
        if (currentFileToMove < 0) break;
        const {length, indexes} = diskMap.getFileLengthAndIndex(currentFileToMove);
        if (!length) {
            currentFileToMove--;
            continue;
        };

        const res = diskMap.tryInsertFile(currentFileToMove, indexes[0], length);

        if(res) indexes.map(i => diskMap[i] = null);

        currentFileToMove--;
    }

    console.log("END")
    //printData(diskMap.getItems());

    return diskMap.getItems() as (number | null)[];
}

export const part2 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        process,
        calculateChecksum,
        Effect.succeed,
    );
}