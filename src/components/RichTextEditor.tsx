import { useState, useRef, useEffect } from 'react'
import { Bold, Heading2, List, ListOrdered, Quote, Minus, Link as LinkIcon } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  const wrapSelection = (before: string, after: string = before) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.substring(start, end) || 'texto'
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newValue)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertLine = (prefix: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart)
    onChange(newValue)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const insertLink = () => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.substring(start, end) || 'enlace'
    const newValue = value.substring(0, start) + `[${selected}](https://)` + value.substring(end)
    onChange(newValue)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + selected.length + 3, start + selected.length + 12)
    }, 0)
  }

  const tools = [
    { icon: Heading2, action: () => insertLine('## '), title: 'Titulo de seccion' },
    { icon: Bold, action: () => wrapSelection('**'), title: 'Negrita' },
    { icon: List, action: () => insertLine('- '), title: 'Lista' },
    { icon: ListOrdered, action: () => insertLine('1. '), title: 'Lista numerada' },
    { icon: Quote, action: () => insertLine('> '), title: 'Cita' },
    { icon: Minus, action: () => onChange(value + '\n---\n'), title: 'Separador' },
    { icon: LinkIcon, action: insertLink, title: 'Enlace' },
  ]

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 border-b border-sand-200 pb-2">
        {tools.map((t, i) => (
          <button
            key={i}
            type="button"
            title={t.title}
            onClick={t.action}
            className="p-2 rounded-lg text-sand-600 hover:bg-sand-100 hover:text-forest-600 transition-all"
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!preview ? 'bg-forest-600 text-white' : 'text-sand-500 hover:bg-sand-100'}`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${preview ? 'bg-forest-600 text-white' : 'text-sand-500 hover:bg-sand-100'}`}
          >
            Vista previa
          </button>
        </div>
      </div>

      {preview ? (
        <div className="min-h-[200px] p-4 rounded-lg border border-sand-200 bg-sand-50">
          <MarkdownContent content={value} />
        </div>
      ) : (
        <textarea
          ref={ref}
          required
          rows={10}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-field font-mono text-sm"
          placeholder={placeholder || 'Escribe el contenido del articulo...'}
        />
      )}

      <p className="text-xs text-sand-400 mt-2">
        Usa los botones de arriba para dar formato. Tambien puedes escribir manualmente: **negrita**, ## titulo, - lista, {'>'} cita, [texto](url).
      </p>
    </div>
  )
}

export function MarkdownContent({ content }: { content: string }) {
  const html = parseMarkdown(content)
  return <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
}

function parseMarkdown(text: string): string {
  const lines = text.split('\n')
  let html = ''
  let inList = false
  let inOrderedList = false

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inList || inOrderedList) { html += '</ul>'; inList = false; inOrderedList = false }
      html += `<h2 class="font-serif text-2xl text-sand-900 mt-6 mb-3">${esc(line.slice(3))}</h2>`
    } else if (line.startsWith('# ')) {
      if (inList || inOrderedList) { html += '</ul>'; inList = false; inOrderedList = false }
      html += `<h1 class="font-serif text-3xl text-sand-900 mt-6 mb-3">${esc(line.slice(2))}</h1>`
    } else if (line.startsWith('- ')) {
      if (inOrderedList) { html += '</ol>'; inOrderedList = false }
      if (!inList) { html += '<ul class="list-disc list-inside text-sand-700 mb-4 space-y-1">'; inList = true }
      html += `<li>${inline(line.slice(2))}</li>`
    } else if (/^\d+\.\s/.test(line)) {
      if (inList) { html += '</ul>'; inList = false }
      if (!inOrderedList) { html += '<ol class="list-decimal list-inside text-sand-700 mb-4 space-y-1">'; inOrderedList = true }
      html += `<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`
    } else if (line.startsWith('> ')) {
      if (inList || inOrderedList) { html += '</ul>'; inList = false; inOrderedList = false }
      html += `<blockquote class="border-l-4 border-forest-400 pl-4 italic text-sand-600 my-4">${inline(line.slice(2))}</blockquote>`
    } else if (line.trim() === '---') {
      if (inList || inOrderedList) { html += '</ul>'; inList = false; inOrderedList = false }
      html += '<hr class="border-sand-200 my-6" />'
    } else if (line.trim() === '') {
      if (inList || inOrderedList) { html += '</ul>'; inList = false; inOrderedList = false }
    } else {
      if (inList || inOrderedList) { html += '</ul>'; inList = false; inOrderedList = false }
      html += `<p class="text-sand-700 leading-relaxed mb-4">${inline(line)}</p>`
    }
  }

  if (inList) html += '</ul>'
  if (inOrderedList) html += '</ol>'
  return html
}

function inline(text: string): string {
  let t = esc(text)
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-sand-900">$1</strong>')
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>')
  t = t.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-forest-600 underline hover:text-forest-700">$1</a>')
  return t
}

function esc(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
