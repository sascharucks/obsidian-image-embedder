import { Editor, MarkdownView, Plugin } from 'obsidian';

export default class ImageEmbedder extends Plugin {

	pasteHandler = (evt: ClipboardEvent, editor: Editor) => UrlIntoSelection(editor, evt);

	async onload() {

		this.addCommand({
			id: 'img-embedder',
			name: 'Embed external image based on Content-Type and file extension',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const selectedText = editor.getSelection();
				if (isValidUrl(selectedText) && await isImageType(selectedText)) {
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

function UrlIntoSelection(editor: Editor, evt: ClipboardEvent) {

	const cb = getClipboardText(evt);

	// Only continue if the String is a URL and has a image extension
	if (!validateString(cb)) {
		return;
	}

	// Prevent paste before processing
	evt.preventDefault();

	editor.replaceSelection(`![](${cb})`);
}

/*
If you copy a URL on iOS Safari it will an URL Object on the clipboard without text.
This functions ensures to get the copied url from "text" or "url".
*/
function getClipboardText(evt: ClipboardEvent): string {
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

function validateString(s: string): boolean {
	if (isValidUrl(s)) {
		return isImageUrl(s)
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
Matches common file extensions for images. Is not working on image URLs without file type.
Image file types from here: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
*/
function isImageUrl(url: string): boolean {
	return (url.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|jfif|pjpeg|pjp|svg|bmp|ico|cur|tif|tiff)$/) != null);
}

/* 
Checks Header for Content-Type "image".
Doesn't work with CORS.
Uses as Fallback standard file type recognition.
*/
async function isImageType(url: string) {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		return response.headers.get('Content-Type')?.startsWith('image')
	} catch {
		// CORS erros will be logged to console even when catched, see https://stackoverflow.com/questions/41515732/hide-401-console-error-in-chrome-dev-tools-getting-401-on-fetch-call
		return isImageUrl(url);
	}
}