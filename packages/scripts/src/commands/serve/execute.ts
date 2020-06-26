/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { BundleMode } from '../build/execute'
import { getWebpackBundleConfigPath } from '../../utils'
import { getWebpackArgs } from '../../utils/webpack'
import { RunArg, runParallel } from '../../jobrunner'

export interface ServeCommandOptions {
	mode: BundleMode
	env: string
	verbose: boolean
}

export async function execute(config: ServeCommandOptions): Promise<number> {
	const runs: Array<RunArg> = []
	const webpackConfigPath = await getWebpackBundleConfigPath()

	runs.push({
		exec: 'webpack-dev-server',
		args: getWebpackArgs(webpackConfigPath, config),
	})

	return runParallel(...runs)
}
