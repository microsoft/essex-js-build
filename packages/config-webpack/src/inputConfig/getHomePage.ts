/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { pkgJson } from './pkgJson.js'

export function getHomePage(): string | boolean {
	return pkgJson.homepage ? pkgJson.homepage : false
}
