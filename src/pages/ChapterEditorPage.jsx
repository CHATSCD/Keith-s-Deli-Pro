import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { supabase } from '../lib/supabase'
import { debounce, countWords } from '../lib/utils'

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors select-none
        ${active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function EditorToolbar({ editor }) {
  if (!editor) return null

  const groups = [
    {
      items: [
        {
          label: <strong>B</strong>,
          title: 'Bold',
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive('bold'),
          disabled: !editor.can().chain().focus().toggleBold().run(),
        },
        {
          label: <em>I</em>,
          title: 'Italic',
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive('italic'),
          disabled: !editor.can().chain().focus().toggleItalic().run(),
        },
        {
          label: <span className="underline">U</span>,
          title: 'Underline',
          action: () => editor.chain().focus().toggleUnderline().run(),
          active: editor.isActive('underline'),
          disabled: !editor.can().chain().focus().toggleUnderline().run(),
        },
      ],
    },
    {
      items: [
        {
          label: 'H2',
          title: 'Heading 2',
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive('heading', { level: 2 }),
        },
        {
          label: 'H3',
          title: 'Heading 3',
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: editor.isActive('heading', { level: 3 }),
        },
      ],
    },
    {
      items: [
        {
          label: '❝',
          title: 'Blockquote',
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive('blockquote'),
        },
        {
          label: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
          title: 'Unordered list',
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive('bulletList'),
        },
        {
          label: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5h11M9 10h11M9 15h11M4 5v.01M4 10v.01M4 15v.01" />
            </svg>
          ),
          title: 'Ordered list',
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive('orderedList'),
        },
      ],
    },
    {
      items: [
        {
          label: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          title: 'Clear formatting',
          action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
          active: false,
        },
      ],
    },
  ]

  return (
    <div className="flex items-center gap-1 flex-wrap px-3 py-2">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-5 bg-gray-200 mx-1" />}
          {group.items.map((item, ii) => (
            <ToolbarButton
              key={ii}
              onClick={item.action}
              active={item.active}
              disabled={item.disabled}
              title={item.title}
            >
              {item.label}
            </ToolbarButton>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Chapter Editor Page ──────────────────────────────────────────────────────

const SAVE_STATUS = { idle: 'idle', saving: 'saving', saved: 'saved', error: 'error' }

export default function ChapterEditorPage() {
  const { bookId, chapterId } = useParams()
  const [chapter, setChapter] = useState(null)
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.idle)
  const [wordCount, setWordCount] = useState(0)
  const contentRef = useRef('')

  // ── Fetch chapter + book ──

  useEffect(() => {
    const load = async () => {
      const [{ data: ch }, { data: bk }] = await Promise.all([
        supabase.from('chapters').select('id, title, content, book_id').eq('id', chapterId).single(),
        supabase.from('books').select('id, title').eq('id', bookId).single(),
      ])
      if (ch) {
        setChapter(ch)
        setTitle(ch.title || '')
        contentRef.current = ch.content || ''
        setWordCount(countWords(ch.content || ''))
      }
      if (bk) setBook(bk)
      setLoading(false)
    }
    load()
  }, [chapterId, bookId])

  // ── Debounced save content ──

  const saveContent = useCallback(
    debounce(async (html) => {
      setSaveStatus(SAVE_STATUS.saving)
      const { error } = await supabase
        .from('chapters')
        .update({ content: html, updated_at: new Date().toISOString() })
        .eq('id', chapterId)
      setSaveStatus(error ? SAVE_STATUS.error : SAVE_STATUS.saved)
    }, 1200),
    [chapterId]
  )

  // ── Debounced save title ──

  const saveTitle = useCallback(
    debounce(async (val) => {
      setSaveStatus(SAVE_STATUS.saving)
      const { error } = await supabase
        .from('chapters')
        .update({ title: val, updated_at: new Date().toISOString() })
        .eq('id', chapterId)
      setSaveStatus(error ? SAVE_STATUS.error : SAVE_STATUS.saved)
    }, 800),
    [chapterId]
  )

  // ── Editor ──

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      contentRef.current = html
      setWordCount(countWords(html))
      saveContent(html)
    },
  })

  // Set initial content once chapter loads
  useEffect(() => {
    if (editor && chapter) {
      editor.commands.setContent(chapter.content || '')
    }
  }, [editor, chapter?.id])

  // ── Title handler ──

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    saveTitle(e.target.value)
  }

  // ── Status label ──

  const statusLabel = {
    [SAVE_STATUS.idle]: '',
    [SAVE_STATUS.saving]: 'Saving…',
    [SAVE_STATUS.saved]: 'Saved',
    [SAVE_STATUS.error]: 'Save failed',
  }[saveStatus]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
          <Link
            to={`/books/${bookId}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 flex-shrink-0 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {book?.title || 'Back'}
          </Link>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">
            {wordCount.toLocaleString()} words
          </span>
          {saveStatus !== SAVE_STATUS.idle && (
            <span
              className={`text-xs ${
                saveStatus === SAVE_STATUS.error ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="border-t border-gray-100 max-w-4xl mx-auto">
          <EditorToolbar editor={editor} />
        </div>
      </div>

      {/* Editor area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
          {/* Chapter title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Chapter title"
            className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none mb-8 bg-transparent"
          />

          {/* Content editor */}
          <EditorContent
            editor={editor}
            className="text-gray-800 text-base leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
