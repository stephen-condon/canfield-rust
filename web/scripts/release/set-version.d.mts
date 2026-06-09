export interface VersionFiles {
  cargoCrates: string[]
  packageJson: string
}

export declare const DEFAULT_FILES: VersionFiles

export declare function setVersion(version: string, files?: VersionFiles): Promise<void>
