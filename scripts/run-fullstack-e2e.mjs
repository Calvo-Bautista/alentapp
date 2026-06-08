import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const testScript = process.argv.includes('--headed')
    ? 'e2e:fullstack:headed'
    : 'e2e:fullstack';

function runScript(script) {
    return new Promise((resolve, reject) => {
        const child = spawn(npmCommand, ['run', script], { stdio: 'inherit' });

        child.on('error', reject);
        child.on('exit', (code, signal) => {
            if (signal) {
                reject(new Error(`El script ${script} finalizo por la señal ${signal}`));
                return;
            }

            resolve(code ?? 1);
        });
    });
}

let exitCode = 1;

try {
    const upExitCode = await runScript('e2e:fullstack:up');
    exitCode = upExitCode === 0 ? await runScript(testScript) : upExitCode;
} catch (error) {
    console.error(error);
} finally {
    try {
        const downExitCode = await runScript('e2e:fullstack:down');
        if (exitCode === 0) exitCode = downExitCode;
    } catch (error) {
        console.error(error);
    }
}

process.exitCode = exitCode;
