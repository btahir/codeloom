import { promises as fs } from 'fs'
import path from 'path'
import ignore from 'ignore'

const EXCLUDED_EXTENSIONS = [
  '.ico', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.woff', '.woff2',
  '.ttf', '.eot', '.otf', '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.flac', '.aac', '.zip', '.tar', '.gz', '.rar', '.7z', '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
]

async function readGitignore(rootDir) {
  try {
    const gitignorePath = path.join(rootDir, '.gitignore')
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8')
    return ignore().add(gitignoreContent)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No .gitignore file found. Proceeding with default ignore rules.')
      return ignore()
    }
    throw error
  }
}

async function countLines(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  return content.split('\n').length
}

async function mapDirectory(dirPath, ig, rootDir, maxLines) {
  const result = {
    name: path.basename(dirPath),
    type: 'directory',
    children: [],
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.relative(rootDir, fullPath)

      if (ig.ignores(relativePath)) {
        console.log(`Ignoring: ${relativePath}`)
        continue
      }

      if (entry.isDirectory()) {
        console.log(`Mapping directory: ${relativePath}`)
        const subdirMap = await mapDirectory(fullPath, ig, rootDir, maxLines)
        if (subdirMap.children.length > 0) {
          result.children.push(subdirMap)
        }
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase()
        if (EXCLUDED_EXTENSIONS.includes(extension)) {
          console.log(`Skipping binary file: ${relativePath}`)
          continue
        }

        try {
          const lineCount = await countLines(fullPath)
          if (lineCount <= maxLines) {
            console.log(`Adding file: ${relativePath} (${lineCount} lines)`)
            result.children.push({
              name: entry.name,
              type: 'file',
              extension: extension,
              lines: lineCount,
            })
          } else {
            console.log(`Skipping large file: ${relativePath} (${lineCount} lines)`)
          }
        } catch (error) {
          console.error(`Error processing file ${fullPath}:`, error)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }

  return result
}

export async function mapCodebase(directories, maxLines, outputDir) {
  const rootDir = process.cwd()
  console.log('Welcome to CodeLoom - Mapping your codebase')
  console.log('Using root directory:', rootDir)

  await fs.mkdir(outputDir, { recursive: true })

  const ig = await readGitignore(rootDir)
  ig.add(path.relative(rootDir, outputDir))

  console.log(`Max lines per file: ${maxLines}`)
  console.log('Mapping directories:', directories)

  const codebaseMap = {
    name: 'root',
    type: 'directory',
    children: [],
  }

  for (const dir of directories) {
    const fullDirPath = path.resolve(rootDir, dir)
    try {
      const stats = await fs.stat(fullDirPath)
      if (stats.isDirectory()) {
        console.log(`\nMapping directory: ${dir}`)
        const dirMap = await mapDirectory(fullDirPath, ig, rootDir, maxLines)
        if (dirMap.children.length > 0) {
          codebaseMap.children.push(dirMap)
        }
      } else {
        console.log(`${fullDirPath} is not a directory. Skipping.`)
      }
    } catch (error) {
      console.error(`Error processing directory ${fullDirPath}:`, error)
    }
  }

  const outputFile = path.join(outputDir, 'codeloom-map.json')
  await fs.writeFile(outputFile, JSON.stringify(codebaseMap, null, 2))
  console.log(`\nCodebase map saved to ${outputFile}`)

  return codebaseMap
}