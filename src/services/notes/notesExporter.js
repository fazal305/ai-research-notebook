import { downloadTextFile } from '../../utils/fileUtils.js'

const FORMATS = {
  md: { extension: '.md', mimeType: 'text/markdown' },
  txt: { extension: '.txt', mimeType: 'text/plain' },
}

export function exportNote(note, format = 'md') {
  const meta = FORMATS[format] ?? FORMATS.md
  downloadTextFile(`${note.title}${meta.extension}`, note.content, meta.mimeType)
}
