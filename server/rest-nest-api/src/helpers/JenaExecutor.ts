import { exec, execFile, fork, spawn } from 'child_process';
import path, { resolve } from 'path/posix';
import { SparqlQuery } from '../model/SparqlQuery';

// function spawnProcess(command: string, args: string[]) {
//   const execProcess = spawn(command, args);
//   console.log('spawn');
//   console.log(execProcess.spawnfile);
//   execProcess.on('spawn', () => {
//     console.log('spawn on spawn');
//   });
//   execProcess.stdout.on('data', (data) => {
//     console.log(`spawn stdout: ${data}`);
//   });
//   execProcess.stderr.on('data', (data) => {
//     console.log(`spawn on error ${data}`);
//   });
//   execProcess.on('exit', (code, signal) => {
//     console.log(`spawn on exit code: ${code} signal: ${signal}`);
//   });
//   execProcess.on('close', (code: number, args: any[]) => {
//     console.log(`spawn on close code: ${code} args: ${args}`);
//   });
// }

// return spawnProcess(this.cmd.terminal, cmd).then(
//   (data) => {
//     console.log('async result:\n' + data);
//     return data;
//   },
//   (err) => {
//     console.error('async error:\n' + err);
//   },
// );

async function spawnProcess(command: string, args: string[]) {
  const execProcess = spawn(command, args);

  let data = '';
  for await (const chunk of execProcess.stdout) {
    data += chunk;
  }
  let error = '';
  for await (const chunk of execProcess.stderr) {
    error += chunk;
  }
  const exitCode = await new Promise((resolve, reject) => {
    execProcess.on('close', resolve);
  });

  if (exitCode) {
    throw new Error(`subprocess error exit ${exitCode}, ${error}`);
  }
  return data;
}

class Comand {
  terminal: string;
  cmd: string;
  args: string[];
}

export class JenaExecutor {
  private cmd: Comand;
  constructor() {
    this.cmd = {
      terminal: 'powershell',
      cmd: 'sparql',
      args: ['--data data/rdf.xml', '--query data/prop2.sparql'],
    };
  }

  async runQuery(rdfPath: string, propertyPath: string): Promise<string> {
    // args: ['--data data/rdf.xml', '--query data/prop2.sparql'],
    this.cmd = {
      terminal: 'powershell',
      cmd: 'sparql',
      args: ['--data ' + rdfPath, '--query ' + propertyPath],
    };
    const cmd = [this.cmd.cmd].concat(this.cmd.args);
    console.log(cmd);
    const data = await spawnProcess(this.cmd.terminal, cmd);
    console.log(data);
    return data;
  }
}
