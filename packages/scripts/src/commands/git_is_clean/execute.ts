/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { runSequential } from '../../jobrunner'

/**
 * Verifies that there are no active changes in the git index.
 */
export async function execute(): Promise<number> {
	return runSequential({
		exec: 'git',
		args: ['diff-index', '--quiet', 'HEAD'],
	})
}
