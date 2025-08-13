import fs from 'fs';
import link from "./autolink";
import path from 'path';

const androidRoot = path.join(process.cwd(), 'android');

if (fs.existsSync(androidRoot)) {
    link();
}