import fs from 'fs';
import link from "./autolink";
import path from 'path';

const iosRoot = path.join(process.cwd(), 'ios');

if (fs.existsSync(iosRoot)) {
    link();
}