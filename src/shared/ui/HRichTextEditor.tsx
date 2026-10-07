import { useEffect } from 'react'
import { EditorContent, useEditor, useEditorState, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Undo2, Redo2 } from 'lucide-react'
import { HButton } from './HButton'
import { documentText, plainTextDocument, richTextSchema, type RichTextNode } from '../schemas/richText'
const extensions = [StarterKit.configure({ link: false, code: false, codeBlock: false, heading: { levels: [1, 2, 3] }, trailingNode: false })]
function editorContent(node: RichTextNode): JSONContent { return { type: node.type, ...(node.text !== undefined ? { text: node.text } : {}), ...(node.attrs ? { attrs: node.attrs } : {}), ...(node.marks ? { marks: node.marks } : {}), ...(node.content ? { content: node.content.map(editorContent) } : {}) } }
export function HRichTextEditor({ value, text, onChange, disabled = false, label }: { value: RichTextNode | null; text: string; onChange: (value: RichTextNode, text: string) => void; disabled?: boolean; label: string }) {
  const editor = useEditor({ extensions, content: editorContent(value || plainTextDocument(text)), editable: !disabled, editorProps: { attributes: { role: 'textbox', 'aria-label': label, 'aria-multiline': 'true' } }, onUpdate: ({ editor, transaction }) => {
    if (!transaction.docChanged) return
    const content = richTextSchema.parse(editor.getJSON())
    if (JSON.stringify(editorContent(content)) === JSON.stringify(editorContent(value || plainTextDocument(text)))) return
    onChange(content, documentText(content))
  } })
  useEffect(() => { editor?.setEditable(!disabled, false) }, [editor, disabled])
  useEffect(() => {
    if (!editor) return
    const content = editorContent(value || plainTextDocument(text))
    if (JSON.stringify(content) !== JSON.stringify(editorContent(richTextSchema.parse(editor.getJSON())))) editor.commands.setContent(content, { emitUpdate: false })
  }, [editor, value, text])
  const state = useEditorState({ editor, selector: ({ editor }) => ({ bold: editor?.isActive('bold'), italic: editor?.isActive('italic'), underline: editor?.isActive('underline'), list: editor?.isActive('bulletList'), ordered: editor?.isActive('orderedList'), heading: editor?.isActive('heading'), undo: editor?.can().undo(), redo: editor?.can().redo() }) })
  return <div className="h-rich-editor" data-disabled={disabled}><div className="h-rich-toolbar" role="toolbar" aria-label={`Mise en forme : ${label}`}>
    <HButton variant="ghost" size="icon" title="Gras" aria-label="Gras" aria-pressed={state?.bold ?? false} disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={14} /></HButton>
    <HButton variant="ghost" size="icon" title="Italique" aria-label="Italique" aria-pressed={state?.italic ?? false} disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={14} /></HButton>
    <HButton variant="ghost" size="icon" title="Souligné" aria-label="Souligné" aria-pressed={state?.underline ?? false} disabled={disabled} onClick={() => editor?.chain().focus().toggleUnderline().run()}><Underline size={14} /></HButton>
    <HButton variant="ghost" size="icon" title="Titre" aria-label="Titre de paragraphe" aria-pressed={state?.heading ?? false} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></HButton>
    <HButton variant="ghost" size="icon" title="Liste à puces" aria-label="Liste à puces" aria-pressed={state?.list ?? false} disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={14} /></HButton>
    <HButton variant="ghost" size="icon" title="Liste numérotée" aria-label="Liste numérotée" aria-pressed={state?.ordered ?? false} disabled={disabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></HButton>
    <span className="h-rich-toolbar-spacer" />
    <HButton variant="ghost" size="icon" title="Annuler" aria-label="Annuler la saisie" disabled={disabled || !state?.undo} onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={14} /></HButton>
    <HButton variant="ghost" size="icon" title="Rétablir" aria-label="Rétablir la saisie" disabled={disabled || !state?.redo} onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={14} /></HButton>
  </div><EditorContent editor={editor} /><div className="h-rich-footer">{text.length.toLocaleString('fr-FR')} / 10 000 caractères</div></div>
}
