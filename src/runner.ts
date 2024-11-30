import { Effect, pipe } from "effect";

const zeroPad = (num: any, places: number) => String(num).padStart(places, '0');

const logHeader = (day: string, part: string) => {
    console.log(`\nDay ${day}, ${part}:`);
};

const run = async () => {
    const [day, part] = process.argv.slice(2);

    if (!day || !part) {
        console.error("Usage: tsx runner.ts <day> <part1/part2>");
        process.exit(1);
    }

    const dayPadded = zeroPad(day, 2);

    const dayModule = await import(`./days/${dayPadded}/index.ts`);
    const partFunction = dayModule[part];

    const startTime = Date.now();

    if (!partFunction) {
        console.error(`Part "${part}" not found in day ${day}.`);
        process.exit(1);
    }

    await pipe(
        partFunction(),
        Effect.runPromise
    )
        .then((result) => {
            logHeader(dayPadded, part);
            const endTime = Date.now();
            const duration = (endTime - startTime);
            console.log(`Result - ${result}`);
            console.log(`\n(Execution time: ${duration}ms)\n`);
        })
        .catch((err) => {
            logHeader(dayPadded, part);
            console.error(`[!] Error: ${err}\n`);
        })
};

run();