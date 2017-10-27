#!/usr/bin/env node

const cp = require('child_process');
const {writeFileSync} = require('fs');
const {dirname, resolve} = require('path');
const inquirer = require('inquirer');
const slug = require('slug');

const {execSync} = cp;

const isWin = process.platform.startsWith('win')
const spawn = isWin ? function(command, args, options) {
  return cp.spawn('cmd.exe', ['/c', command, ...args],  options);
} : cp.spawn;

const ocularPath = resolve(dirname(__filename));
const appPath = resolve(ocularPath, '..', '..');

const configTemplate = require(resolve(ocularPath, 'templates', 'config.js'));
const variablesTemplate = require(resolve(ocularPath, 'templates', 'variables.scss'));
const htmlConfigTemplate = require(resolve(ocularPath, 'templates', 'html.config.js'));

const DEBUGGING = process.argv.includes('--debug');

const env = Object.assign(process.env, {
  DIR_PATH: ocularPath,
  DEBUGGING,
});

const commands = {

  init: () => {

    inquirer.prompt([{
      name: 'name',
      message: 'What will be the name of your project?',
      validate: v => Boolean(v) || 'You should provide a name.',
    }, {
      type: 'list',
      choices: ['github', 'phab'],
      name: 'type',
      message: 'Where will your project be hosted?',
    }, {
      name: 'org',
      message: 'Which organisation will host the repo?',
      validate: v => Boolean(v) || 'You should provide an org.',
      when: ({type}) => type === 'github',
    }, {
      name: 'phabUrl',
      message: 'What is the phabricator url?',
      validate: v => Boolean(v) || 'You should provide an url.',
      when: ({type}) => type === 'phab',
    }, {
      name: 'desc',
      message: 'Provide a basic description of your project',
      validate: v => Boolean(v) || 'You should provide a description.',
    }])
      .then(res => {

        execSync('mkdir -p static src src/styles');

        const json = require(resolve(ocularPath, 'package.json'));

        json.name = slug(res.name);
        json.description = res.desc;

        json.scripts = {
          start: 'ocular start',
          build: 'ocular build',
          lint: 'ocular lint',
        };

        writeFileSync(resolve(ocularPath, 'package.json'), `${JSON.stringify(json, null, 2)}\n`);
        writeFileSync(resolve(ocularPath, 'html.config.js'), htmlConfigTemplate(res));
        writeFileSync(resolve(ocularPath, 'src', 'config.js'), configTemplate(res));
        writeFileSync(resolve(ocularPath, 'src', 'mdRoutes.js'), 'export default [];\n');
        writeFileSync(resolve(ocularPath, 'src', 'demos.js'), 'export default {};\n');
        writeFileSync(resolve(ocularPath, 'src', 'styles', 'index.scss'), '');
        writeFileSync(resolve(ocularPath, 'src', 'styles', '_variables.scss'), variablesTemplate());

      });

  },

  start: () => {

    const shouldOpen = process.argv.includes('open');

    spawn('webpack-dev-server', [
      ...(shouldOpen ? ['--open'] : []),
      '--config',
      'webpack/dev',
    ], {cwd: __dirname, stdio: 'inherit', env});

  },

  lint: () => {

    spawn('eslint', [
      resolve(ocularPath, 'src'),
      '-c',
      '.eslintrc',
    ], {cwd: __dirname, stdio: 'inherit'});

  },

  build: () => {

    execSync(`rm -rf ${resolve(appPath, 'dist')}`);

    spawn('webpack', [
      '--config',
      'webpack/build',
    ], {
      cwd: __dirname,
      stdio: 'inherit',
      env: Object.assign(env, {NODE_ENV: 'production'}),
    });

  },

  help: () => {
    console.log(`
Ocular CLI
----------

Available commands:

- init: create the bootstrap files in the current project
- start: launch webpack in dev mode (accepts 'open' arg)
- lint: run eslint on the current project
- build: generate the bundle and dist files

You can provide the --debug flag to print the computed webpack config.
`);
  }

};

const command = process.argv[2];
if (!commands[command]) { return commands.help(); }

commands[command]();
