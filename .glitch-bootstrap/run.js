require('dotenv').config();

if(!process.env.TIW_GIT_ARCHIVE_URL) {
  throw new Error("Missing `TIW_GIT_ARCHIVE_URL` environment variable.");
}

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_HOME_PATH = path.resolve(__dirname, '..');
const PROJECT_ZIP_PATH = path.resolve(__dirname, 'project.zip');

const run = (command) => execSync(command, { encoding: "utf8" });

run("git reset HEAD^");

// Download project
run(`wget ${process.env.TIW_GIT_ARCHIVE_URL} -O ${PROJECT_ZIP_PATH} --no-hsts`);

// Unzip archive
run(`unzip -o ${PROJECT_ZIP_PATH} -d ${__dirname}`);

// Remove package.json
const packageJsonPath = path.resolve(PROJECT_HOME_PATH, "package.json");
run(`rm ${packageJsonPath}`);

// Move files
const rootFolder = run(`unzip -l ${PROJECT_ZIP_PATH} | awk '/-----/ {p = ++p % 2; next} p {print $NF;exit}'`);
const from = path.resolve(__dirname, rootFolder.trim());
run(`rsync -avI ${from}/ ${PROJECT_HOME_PATH}/`);

// Remove bootstrap folder
const glitchBootstrapPath = path.resolve(PROJECT_HOME_PATH, ".glitch-bootstrap");
run(`rm -R ${glitchBootstrapPath}`);

// Set The Interweb token
run(`find . -type f -exec sed -i 's/__TIW_TOKEN__/${process.env.TIW_TOKEN}/g' {} +`);

run("git add .");
run(`git commit -m"Project bootstraped"`);

// Will restart Glitch container
// See: https://help.glitch.com/kb/article/65-files-that-i-created-or-edited-via-the-terminal-or-with-code-aren-t-appearing-or-updating-in-the-editor-why/
run("refresh");
