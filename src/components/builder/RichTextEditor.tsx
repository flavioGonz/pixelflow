'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import {
    Bold, Italic, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Heading1, Heading2, Palette, Highlighter
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const btnClass = (active: boolean) =>
        `p-1.5 rounded transition-all ${active ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-neutral-400'}`;

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-white/5 bg-black/20 rounded-t-xl">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={btnClass(editor.isActive('bold'))}
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={btnClass(editor.isActive('italic'))}
            >
                <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 self-center" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={btnClass(editor.isActive('heading', { level: 1 }))}
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={btnClass(editor.isActive('heading', { level: 2 }))}
            >
                <Heading2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 self-center" />
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={btnClass(editor.isActive({ textAlign: 'left' }))}
            >
                <AlignLeft className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={btnClass(editor.isActive({ textAlign: 'center' }))}
            >
                <AlignCenter className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={btnClass(editor.isActive({ textAlign: 'right' }))}
            >
                <AlignRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 self-center" />
            <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={btnClass(editor.isActive('highlight'))}
            >
                <Highlighter className="w-4 h-4" />
            </button>
            <div className="relative flex items-center group">
                <Palette className="w-4 h-4 text-neutral-400 ml-1" />
                <input
                    type="color"
                    onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#ffffff'}
                    className="w-4 h-4 bg-transparent border-none p-0 cursor-pointer ml-1"
                />
            </div>
        </div>
    );
};

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-all">
            <MenuBar editor={editor} />
            <EditorContent
                editor={editor}
                className="prose prose-invert max-w-none p-4 min-h-[150px] bg-neutral-900/50 outline-none text-sm"
            />
            <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
      `}</style>
        </div>
    );
}
