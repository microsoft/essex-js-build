/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import type { Command } from 'commander'

import { esmify as processEsm } from '../steps/esmify/index.mjs'
import { compile as compileTypescript } from '../steps/typescript/index.mjs'
import { BuildMode } from '../types.mjs'
import { never } from '../util/never.mjs'

export interface WatchCommandOptions {
	/**
	 * Strips internal types from typings output
	 */
	stripInternalTypes?: boolean
	mode?: BuildMode
}

// biome-ignore lint/style/noDefaultExport: this is a CLI command
export default function build(program: Command): void {
	program
		.command('watch')
		.description('sets up build-watchers for a library package')
		.option(
			'--stripInternalTypes',
			'strip out internal types from typings declarations',
		)
		.option('--mode [mode]', 'options are "dual" and "esm"')
		.action(async (options: WatchCommandOptions): Promise<void> => {
			await executeWatch(options)
		})
}

export function executeWatch({
	stripInternalTypes = false,
	mode = BuildMode.Esm,
}: WatchCommandOptions): Promise<void> {
	const rewriteEsmToMjs = mode === BuildMode.Dual
	const esmOnly = mode === BuildMode.Esm
	const cwd = process.cwd()
	const tsConfigPath = path.join(cwd, 'tsconfig.json')

	if (!existsSync(tsConfigPath)) {
		throw new Error('tsconfig.json must exist')
	}

	let initialAddsComplete = false

	chokidar.watch('./src').on('all', (event, path) => {
		if (event !== 'add' && event !== 'addDir') {
			initialAddsComplete = true
		}
		if (initialAddsComplete) {
			console.info(chalk.yellow(`    [${event}] ${path}`))
			compileTypescript(stripInternalTypes, esmOnly)
				.then(() => {
					return processEsm(rewriteEsmToMjs, esmOnly ? 'dist' : 'dist/esm')
				})
				.then(() => {
					/* nothing */
				})
				.catch(() => {
					/* nothing */
				})
		}
	})

	return never()
}
