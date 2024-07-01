import path from "path"
import findUp from 'escalade/sync'



const uixConfigFies = new Set([
    `uix.config.js`,
    `uix.config.ts`,
    `uix.config.json`,
])
const isUixConfig = (filename: string) => uixConfigFies.has(filename)

export const findConfig = ({ relativePathToConfig }: { relativePathToConfig?: string }) => {
    if (relativePathToConfig) return path.resolve(relativePathToConfig)
    const configPath = findUp(process.cwd(), (_dir, paths) => paths.find(isUixConfig))
    if (!configPath) throw new Error('Could not find uix.config file')
    return configPath
}