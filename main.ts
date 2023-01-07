import { Editor, MarkdownView, Plugin } from 'obsidian';

export default class ImageEmbedder extends Plugin {

	pasteHandler = (evt: ClipboardEvent, editor: Editor) => UrlIntoSelection(editor, evt);

	async onload() {

		this.addCommand({
			id: 'img-embedder',
			name: 'Embed external image',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const selectedText = editor.getSelection();
				if (await validateString(selectedText)) {
					editor.replaceSelection(`![](${selectedText})`);
				}
			}
		});

		this.app.workspace.on("editor-paste", this.pasteHandler);
	}

	onunload() {
		this.app.workspace.off("editor-paste", this.pasteHandler);
	}
}

async function UrlIntoSelection(editor: Editor, evt: ClipboardEvent) {

	const cb = getClipboardText(evt);

	// Prevent paste before async processing
	evt.preventDefault();

	if (await validateString(cb)) {
		editor.replaceSelection(`![](${cb})`);
	} else {
		// Still paste everthing that is not an image to embed
		editor.replaceSelection(`${cb}`);
	}
}

/*
If you copy a URL on iOS Safari it will an URL Object on the clipboard without text.
This functions ensures to get the copied url from "text" or "url".
*/
function getClipboardText(evt: ClipboardEvent) {
	const cbText = evt.clipboardData!.getData("text");
	const cbUrl = evt.clipboardData!.getData("url");

	if (cbUrl.toString() != "") {
		return cbUrl.toString();
	} else if (cbText != "") {
		return cbText;
	} else {
		return "";
	}
}

async function validateString(s: string) {
	if (isValidUrl(s)) {
		return await isImageUrl(s)
	} else {
		return false;
	}
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (err) {
		return false;
	}
};

/*
If the URL fetch failes this fallback looks at the file extensions
Image file types from here: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
*/
function isImageUrlFallback(url: string): boolean {
	return (url.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|jfif|pjpeg|pjp|svg|bmp|ico|cur|tif|tiff)$/) != null);
}

/* 
Checks Header for Content-Type "image".
Doesn't work with CORS
*/
async function isImageUrl(url: string) {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		return response.headers.get('Content-Type')?.startsWith('image')
	} catch {
		// CORS erros will be logged to console even when catched, see https://stackoverflow.com/questions/41515732/hide-401-console-error-in-chrome-dev-tools-getting-401-on-fetch-call
		return isImageUrlFallback(url);
	}
}