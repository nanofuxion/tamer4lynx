#!/usr/bin/env node

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

program
    .version(version)
    .description('Tamer4Lynx CLI - A tool for managing Lynx projects');


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


program.parse();
