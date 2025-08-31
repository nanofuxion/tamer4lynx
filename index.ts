#!/usr/bin/env node


import fs from 'fs';
import path from 'path';

import { program } from 'commander';
// Make sure you have a package.json file in the same directory
// with a "version" field for this import to work.
import { version } from './package.json';
import android_create from './src/android/create';
import android_autolink from './src/android/autolink';
import android_bundle from './src/android/bundle';
import ios_create from './src/ios/create';
import ios_autolink from './src/ios/autolink';
import ios_bundle from './src/ios/bundle';
import init from './src/common/init';

program
    .version(version)
    .description('Tamer4Lynx CLI - A tool for managing Lynx projects');

program
    .command('init')
    .description('Initialize tamer.config.json interactively')
    .action(() => {
        init();
    });


// Android commands
const android = program.command('android')
    .description('Android project commands');

android
    .command('create')
    .description('Create a new Android project')
    .action(() => {
        android_create();
    });


android
    .command('link')
    .description('Link native modules to the Android project')
    .action(() => {
        android_autolink();
    });


android
    .command('bundle')
    .description('Link native modules to the Android project')
    .action(() => {
        android_bundle();
    });


// iOS commands
const ios = program.command('ios')
    .description('iOS project commands');


ios.command('create')
    .description('Create a new iOS project')
    .action(() => {
        ios_create();
    });


ios.command('link')
    .description('Link native modules to the iOS project')
    .action(() => {
        ios_autolink();
    });


ios.command('bundle')
    .description('Bundle native modules for the iOS project')
    .action(() => {
        ios_bundle();
    });

program.command('link')
    .option('-i, --ios', 'Link iOS native modules')
    .option('-a, --android', 'Link Android native modules')
    .option('-b, --both', 'Link both iOS and Android native modules')
    .option('-s, --silent', 'Run in silent mode without outputting messages')
    .description('Link native modules to the project')
    .action(() => {
        // console.error('The "link" command is deprecated. Please use "tamer4lynx ios link" or "tamer4lynx android link" instead.');
        // Optionally, you can call the iOS or Android autolink functions directly here
        if (program.opts().silent) {
            console.log = () => {}; // Suppress output
            console.error = () => {}; // Suppress errors
            console.warn = () => {}; // Suppress warnings
        }
        if (program.opts().ios) {
            ios_autolink();
            return;
        }
        if (program.opts().android) {
            android_autolink();
            return;
        }
        ios_autolink();
        android_autolink();
    });

program
    .command('autolink')
    .description('Auto-link native modules to the project')
    .action(async () => {
        const configPath = path.join(process.cwd(), 'tamer.config.json');
        let config: any = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        if (config.autolink) {
            delete config.autolink;
            console.log('Autolink disabled in tamer.config.json');
        } else {
            config.autolink = true;
            console.log('Autolink enabled in tamer.config.json');
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`Updated ${configPath}`);
    })



// If no arguments or only node/index.js, run init

if (process.argv.length <= 2 || (process.argv.length === 3 && process.argv[2] === 'init')) {
    // Run init script and exit
    Promise.resolve(init()).then(() => process.exit(0));
} else {
    program.parse();
    process.exit(0);
}
