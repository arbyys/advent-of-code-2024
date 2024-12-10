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
//   find the other two points on the line which match this distance to `p1` / `p2`
//   -> those two points are the candidates for antinode positions
//   (every possible antinode position can also be outside the grid, careful)

const findAntinodeCandidate = (pt1: Coords, pt2: Coords): [Coords, Coords] => {
    const [x1, y1] = pt1;
    const [x2, y2] = pt2;

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const candidate1X = Math.round(x2 + ((x2 - x1) / distance) * distance);
    const candidate1Y = Math.round(y2 + ((y2 - y1) / distance) * distance);
    const candidate2X = Math.round(x1 + ((x1 - x2) / distance) * distance);
    const candidate2Y = Math.round(y1 + ((y1 - y2) / distance) * distance);

    return [[candidate1X, candidate1Y], [candidate2X, candidate2Y]];
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

const printGrid = (grid: string[][]): string => {
    return grid.map(row => row.join("")).join("\n");
}

const countAntinodes = (rows: string[][]): number => {
    const antennaCoords = getAntennaPositions(rows);
    const antennas = Object.keys(antennaCoords);

    //console.log(antennaCoords);
    //console.log(antennas);

    const antinodesMask = Array(rows.length).fill(null).map(()=>Array(rows[0].length).fill('.'))

    antennas.forEach((antenna) => {
        const coords = antennaCoords[antenna];

        for (let i = 0; i < coords.length; i++) {
            for (let j = i + 1; j < coords.length; j++) {
                const candidates = findAntinodeCandidate(coords[i], coords[j]);

                console.log("C:", candidates);

                if(isInsideGrid(antinodesMask, candidates[0])) {
                    antinodesMask[candidates[0][0]][candidates[0][1]] = "#";
                }
                if(isInsideGrid(antinodesMask, candidates[1])) {
                    antinodesMask[candidates[1][0]][candidates[1][1]] = "#";
                }
            }
        }
    });

    //console.log(printGrid(antinodesMask));

    return antinodesMask.flat().reduce((count, item) => count + (item === "#" ? 1 : 0), 0);
}

export const part2 = (data: string): Effect.Effect<unknown, never, never> => {
    return pipe(
        parse(data),
        countAntinodes,
        Effect.succeed,
    );
}