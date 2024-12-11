import { Effect, pipe, Schema, Either } from "effect";

const LineSchema = Schema.Array(Schema.String);

type Coords = [number, number];

const parse = (data: string) => {
    const lines = data.trim().split("\n");

    const rows: string[][] = [];

    lines.map((line) => {
        const parts = line.trim().split("");
        const decode = Schema.decodeUnknownEither(LineSchema);

        const result = decode(parts);
        if(Either.isRight(result)) {
            rows.push([...result.right]);
        } else
            Effect.fail("Syncing failed");
    });

    return rows;
}

// algorithm:

// for each two points `p1`, `p2` with the same frequency:
//   construct a line between them
//   calculate distance between `p1` and `p2`
//   find all points on the line with where the step equals to distance
//   -> those points are the candidates for antinode positions
//   (every possible antinode position can also be outside the grid, careful)

const findAntinodeCandidates = (grid: string[][], pt1: Coords, pt2: Coords): Coords[] => {
    const [x1, y1] = pt1;
    const [x2, y2] = pt2;

    const distance = Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2));

    let result: Coords[] = [];

    // 1) start on point2, traverse in point1 direction
    let lastCoord = [x2, y2];
    let currentCoord: Coords = [
        Math.round(x2 + ((x2 - x1) / distance) * distance),
        Math.round(y2 + ((y2 - y1) / distance) * distance)
    ];

    while(isInsideGrid(grid, currentCoord)) {
        result.push(currentCoord);
        
        const temp = [...currentCoord];
        currentCoord = [
            Math.round(currentCoord[0] + ((currentCoord[0] - lastCoord[0]) / distance) * distance),
            Math.round(currentCoord[1] + ((currentCoord[1] - lastCoord[1]) / distance) * distance)
        ]
        lastCoord = [...temp];
    }

    // 2) start on point1, traverse in point2 direction
    lastCoord = [x1, y1];
    currentCoord = [
        Math.round(x1 + ((x1 - x2) / distance) * distance),
        Math.round(y1 + ((y1 - y2) / distance) * distance)
    ];

    while(isInsideGrid(grid, currentCoord)) {
        result.push(currentCoord);

        const temp = [...currentCoord];
        currentCoord = [
            Math.round(currentCoord[0] + ((currentCoord[0] - lastCoord[0]) / distance) * distance),
            Math.round(currentCoord[1] + ((currentCoord[1] - lastCoord[1]) / distance) * distance)
        ]
        lastCoord = [...temp];
    }

    return result;
}

const getAntennaPositions = (grid: string[][]): Record<string, Coords[]> => {
    return grid.reduce<Record<string, [number, number][]>>((acc, row, rowIndex) => {
        row.reduce((rowAcc, char, colIndex) => {
            if (char !== '.') {
                rowAcc[char] = [...(rowAcc[char] || []), [rowIndex, colIndex]];
            }
            return rowAcc;
        }, acc);
        return acc;
    }, {});
}

const isInsideGrid = (grid: string[][], coords: Coords): boolean => {
    return !!grid[coords[0]] && (
        (coords[0] >= 0 && coords[0] < grid.length)
        &&
        (coords[1] >= 0 && coords[1] < grid[coords[0]]?.length)
    );
}

const countAntinodes = (rows: string[][]): number => {
    const antennaCoords = getAntennaPositions(rows);
    const antennas = Object.keys(antennaCoords);

    const antinodesMask = Array(rows.length).fill(null).map(()=>Array(rows[0].length).fill('.'))

    antennas.forEach((antenna) => {
        const coords = antennaCoords[antenna];

        for (let i = 0; i < coords.length; i++) {
            for (let j = i + 1; j < coords.length; j++) {
                antinodesMask[coords[i][0]][coords[i][1]] = "#";
                antinodesMask[coords[j][0]][coords[j][1]] = "#";

                const candidates = findAntinodeCandidates(rows, coords[i], coords[j]);

                candidates.forEach((item) => {
                    antinodesMask[item[0]][item[1]] = "#";
                });
            }
        }
    });

    return antinodesMask.flat().reduce((count, item) => count + (item === "#" ? 1 : 0), 0);
}

export const part2 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        countAntinodes,
        Effect.succeed,
    );
}