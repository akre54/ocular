#!/usr/bin/env node

const cp = require('child_process');
const {writeFileSync} = require('fs');
const {resolve} = require('path');
const inquirer = require('inquirer');
const slug = require('slug');

const {execSync} = cp;

const isWin = process.platform.startsWith('win')
const spawn = isWin ? function(command, args, options) {
  return cp.spawn('cmd.exe', ['/c', command, ...args],  options);
} : cp.spawn;

const configTemplate = require(resolve('.', 'templates', 'config'));
const variablesTemplate = require(resolve('.', 'templates', 'variables.scss'));
const htmlConfigTemplate = require(resolve('.', 'templates', 'html.config'));

const DIR_PATH = process.cwd();

const DEBUGGING = process.argv.includes('--debug');

const env = Object.assign(process.env, {
  DIR_PATH,
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

        const json = require(resolve(DIR_PATH, 'package.json'));

        json.name = slug(res.name);
        json.description = res.desc;

        json.scripts = {
          start: 'ocular start',
          build: 'ocular build',
          lint: 'ocular lint',
        };

        writeFileSync(resolve(DIR_PATH, 'package.json'), `${JSON.stringify(json, null, 2)}\n`);
        writeFileSync(resolve(DIR_PATH, 'html.config.js'), htmlConfigTemplate(res));
        writeFileSync(resolve(DIR_PATH, 'src', 'config.js'), configTemplate(res));
        writeFileSync(resolve(DIR_PATH, 'src', 'mdRoutes.js'), 'export default [];\n');
        writeFileSync(resolve(DIR_PATH, 'src', 'demos.js'), 'export default {};\n');
        writeFileSync(resolve(DIR_PATH, 'src', 'styles', 'index.scss'), '');
        writeFileSync(resolve(DIR_PATH, 'src', 'styles', '_variables.scss'), variablesTemplate());

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
      resolve(DIR_PATH, 'src'),
      '-c',
      '.eslintrc',
    ], {cwd: __dirname, stdio: 'inherit'});

  },

  build: () => {

    execSync(`rm -rf ${resolve(DIR_PATH, 'dist')}`);

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
