import Bun from "bun";

await Bun.build({
    entrypoints: ['./index.ts'],
    tsconfig: './tsconfig.json',
    target: 'node',
    outdir: './dist'
});