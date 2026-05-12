import { Command } from 'commander';
import pc from 'picocolors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runAdd } from './commands/add.js';
import { runEnable } from './commands/enable.js';
import { runUpdate } from './commands/update.js';
import { runDoctor } from './commands/doctor.js';
import { runVerify } from './commands/verify.js';

// Read CLI version once at entry; pass to subcommands that need it (avoids each command re-resolving its bundled location).
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPkgJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as { version?: string };
const CLI_VERSION: string = cliPkgJson.version ?? '0.0.0';

const program = new Command();

program
  .name('firebase-totp-mfa')
  .description('Add Firebase TOTP MFA in 30 seconds. shadcn-style CLI.')
  .version(CLI_VERSION);

program
  .command('add [framework]')
  .description('Add TOTP MFA source files to your project (next | next-pages | vite | cra | expo)')
  .option('--area <path>', 'Path area to protect with MFA', '/account')
  .option('--issuer <name>', 'Issuer label shown in Authenticator app', 'YourApp')
  .option('--firebase-export <path>', 'Explicit Firebase auth export path')
  .option('--include-recovery', 'Include recovery codes UI', true)
  .option('--no-include-recovery', 'Skip recovery codes UI')
  .option('--server <framework>', 'Server-side MFA verify snippet', 'none')
  .option('--dry-run', 'Print diff, do not write files', false)
  .option('-y, --yes', 'Skip confirmation prompts', false)
  .action(async (framework: string | undefined, opts: Record<string, unknown>) => {
    const code = await runAdd(framework, {
      area: String(opts['area'] ?? '/account'),
      issuer: String(opts['issuer'] ?? 'YourApp'),
      firebaseExport: opts['firebaseExport'] as string | undefined,
      includeRecovery: opts['includeRecovery'] !== false,
      server: (opts['server'] as AddServer) ?? 'none',
      dryRun: opts['dryRun'] === true,
      yes: opts['yes'] === true,
      cwd: process.cwd(),
      cliVersion: CLI_VERSION,
    });
    process.exit(code);
  });

program
  .command('enable')
  .description('Enable Identity Platform TOTP MFA on your GCP project (5-step safe)')
  .requiredOption('--project <id>', 'GCP project ID')
  .option('--adjacent-intervals <n>', 'TOTP code window (0-10)', '1')
  .option('--dry-run', 'Print diff, do not PATCH', false)
  .option('-y, --yes', 'Skip confirmation prompts', false)
  .action(async (opts: Record<string, unknown>) => {
    const n = Number(opts['adjacentIntervals'] ?? 1);
    if (Number.isNaN(n) || n < 0 || n > 10) {
      console.error(pc.red('--adjacent-intervals must be an integer 0-10'));
      process.exit(2);
    }
    const code = await runEnable({
      project: String(opts['project']),
      adjacentIntervals: n,
      dryRun: opts['dryRun'] === true,
      yes: opts['yes'] === true,
    });
    process.exit(code);
  });

program
  .command('update')
  .description('Check if local registry source files diverged from the kit (dry-run by default in alpha)')
  .option('--apply', 'Apply updates (Phase 2.1 — not yet implemented). Default = dry-run.', false)
  .action(async (opts: Record<string, unknown>) => {
    const result = await runUpdate({
      projectRoot: process.cwd(),
      apply: opts['apply'] === true,
      registryVersion: CLI_VERSION,
    });
    process.exit(result.exitCode);
  });

program
  .command('doctor')
  .description('Diagnose your environment')
  .action(async () => {
    const code = await runDoctor({ cwd: process.cwd() });
    process.exit(code);
  });

program
  .command('verify')
  .description('Print manual verification scenarios')
  .action(async () => {
    const code = await runVerify();
    process.exit(code);
  });

program.showHelpAfterError();

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(pc.red('CLI error:'), err);
  process.exit(1);
});

type AddServer = 'express' | 'cloud-functions' | 'cloud-run' | 'next-route-handler' | 'none';
