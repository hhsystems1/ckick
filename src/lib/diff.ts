export interface FileDiff {
  path: string
  originalContent: string
  newContent: string
  diff: string
}

export interface DiffResult {
  files: FileDiff[]
  summary: string
}

export function computeDiff(original: string, modified: string): string {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  const diffLines: string[] = []
  
  let i = 0
  let j = 0
  
  while (i < originalLines.length || j < modifiedLines.length) {
    if (i >= originalLines.length) {
      diffLines.push(`+ ${modifiedLines[j]}`)
      j++
    } else if (j >= modifiedLines.length) {
      diffLines.push(`- ${originalLines[i]}`)
      i++
    } else if (originalLines[i] === modifiedLines[j]) {
      diffLines.push(`  ${originalLines[i]}`)
      i++
      j++
    } else {
      const originalRest = originalLines.slice(i).join('\n')
      const modifiedRest = modifiedLines.slice(j).join('\n')
      
      const originalRemaining = originalLines.length - i
      const modifiedRemaining = modifiedLines.length - j
      
      const lookAhead = Math.min(3, Math.max(originalRemaining, modifiedRemaining))
      let foundMatch = false
      
      for (let k = 1; k <= lookAhead; k++) {
        if (k <= originalRemaining && modifiedLines.slice(j, j + k).join('\n') === originalLines.slice(i, i + k).join('\n')) {
          for (let l = 0; l < k; l++) {
            diffLines.push(`  ${originalLines[i + l]}`)
          }
          i += k
          j += k
          foundMatch = true
          break
        }
        if (k <= modifiedRemaining && originalLines.slice(i, i + k).join('\n') === modifiedLines.slice(j, j + k).join('\n')) {
          for (let l = 0; l < k; l++) {
            diffLines.push(`- ${originalLines[i + l]}`)
            diffLines.push(`+ ${modifiedLines[j + l]}`)
          }
          i += k
          j += k
          foundMatch = true
          break
        }
      }
      
      if (!foundMatch) {
        diffLines.push(`- ${originalLines[i]}`)
        diffLines.push(`+ ${modifiedLines[j]}`)
        i++
        j++
      }
    }
  }
  
  return diffLines.join('\n')
}

export function applyDiff(original: string, diff: string): string {
  const lines = diff.split('\n')
  const originalLines = original.split('\n')
  const resultLines: string[] = []
  
  let i = 0
  for (const line of lines) {
    if (line.startsWith('  ')) {
      while (i < originalLines.length && originalLines[i] !== line.substring(2)) {
        i++
      }
      if (i < originalLines.length) {
        resultLines.push(line.substring(2))
        i++
      }
    } else if (line.startsWith('+ ')) {
      resultLines.push(line.substring(2))
    } else if (line.startsWith('- ')) {
      while (i < originalLines.length && originalLines[i] !== line.substring(2)) {
        i++
      }
      if (i < originalLines.length) {
        i++
      }
    }
  }
  
  return resultLines.join('\n')
}

export function parseDiff(diff: string): { additions: number; deletions: number; unchanged: number } {
  const lines = diff.split('\n')
  let additions = 0
  let deletions = 0
  let unchanged = 0
  
  for (const line of lines) {
    if (line.startsWith('+ ')) additions++
    else if (line.startsWith('- ')) deletions++
    else if (line.startsWith('  ')) unchanged++
  }
  
  return { additions, deletions, unchanged }
}

export function generateUnifiedDiff(path: string, original: string, modified: string): string {
  const diff = computeDiff(original, modified)
  const stats = parseDiff(diff)
  
  let result = `--- a/${path}\n+++ b/${path}\n`
  result += `@@ -${stats.unchanged + stats.deletions + 1},${stats.unchanged + stats.deletions} +${stats.unchanged + stats.additions + 1},${stats.unchanged + stats.additions} @@\n`
  result += diff
  
  return result
}
