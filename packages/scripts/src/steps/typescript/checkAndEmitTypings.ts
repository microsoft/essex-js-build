/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { performance } from 'perf_hooks'
import * as ts from 'typescript'
import { printPerf, subtaskInfo } from '../../util/tasklogger'
import { loadTSConfig, parseTSConfig } from './config'

export async function checkAndEmitTypings(
	fileNames: string[],
	stripInternal: boolean,
): Promise<number> {
	const start = performance.now()
	const config = await loadTSConfig()
	const options = {
		...parseTSConfig(config),
		declaration: true,
		emitDeclarationOnly: true,
		stripInternal,
		outDir: 'dist/types',
	}

	const program = ts.createProgram(fileNames, options)
	const emitResult = program.emit()
	const allDiagnostics = ts
		.getPreEmitDiagnostics(program)
		.concat(emitResult.diagnostics)

	allDiagnostics.forEach(diagnostic => {
		if (diagnostic.file && diagnostic.start) {
			const { line, character } = ts.getLineAndCharacterOfPosition(
				diagnostic.file,
				diagnostic.start,
			)
			const message = ts.flattenDiagnosticMessageText(
				diagnostic.messageText,
				'\n',
			)
			console.log(
				`${diagnostic.file.fileName} (${line + 1},${
					character + 1
				}): ${message}`,
			)
		} else {
			console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
		}
	})

	subtaskInfo(`typings ${printPerf(start)}`)
	return emitResult.emitSkipped ? 1 : 0
}
