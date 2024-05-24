/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */

import { readdirSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import type { Command } from 'commander'
import { program } from 'commander'

import { fileUrl } from './util/fileUrl.mjs'
import { isDebug } from './util/isDebug.mjs'
import { readScriptsPackageJson } from './util/package.mjs'
import { error, fail, info, printPerf, success } from './util/tasklogger.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const commandDir = path.join(__dirname, '/commands')

function establishErrorHandlers(): void {
	process
		.on('unhandledRejection', (reason, p) => {
			console.error(reason, 'unhandled promise rejection', p)
			process.exit(1)
		})
		.on('uncaughtException', (err) => {
			console.error(err, 'uncaught exception')
			process.exit(1)
		})
}

async function loadCommand(file: string): Promise<void> {
	const start = performance.now()
	const commandPath = fileUrl(commandDir, file)

	const command = (await import(commandPath)) as {
		default: (program: Command) => void
	}

	if (command.default) {
		command.default(program)
	} else {
		throw new Error('command.default is not a function')
	}

	if (isDebug()) {
		info(`load command ${file} ${printPerf(start)}`)
	}
}

async function loadAllCommands(): Promise<void> {
	const commands = readdirSync(commandDir)
	await Promise.all(commands.map(loadCommand))
}

async function bootstrap(command: string) {
	const { version } = await readScriptsPackageJson()
	program.version(version)

	if (command !== '-h' && command !== '--help') {
		// Hot route: instead of requiring all commands, only require the one necessary
		try {
			await loadCommand(`_${command}.mjs`)
		} catch (err) {
			console.error(err)
			error(
				`could not load command command "${command}".\nSee --help for a list of available commands.`,
			)
			process.exit(1)
		}
	} else {
		await loadAllCommands()
	}
}

async function execute(): Promise<number> {
	const command = process.argv[2] as string
	try {
		establishErrorHandlers()
		await bootstrap(command)
		const end = performance.now()
		if (isDebug()) {
			info(chalk.green(`essex scripts ready (${(end - 0).toFixed(2)}ms)`))
		}
		await program.parseAsync(process.argv)

		if (!process.exitCode) {
			success(command, printPerf())
			return 0
		}

		fail(command, printPerf())
		return 1
	} catch (err) {
		fail(command)
		throw err
	}
}
execute()
	.then((code) => exit(code))
	.catch((err) => {
		console.error(err)
		exit(1)
	})
