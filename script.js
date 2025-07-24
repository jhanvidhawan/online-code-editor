document.addEventListener('DOMContentLoaded', function () {
    const htmlEditor = ace.edit("html-editor");
    const cssEditor = ace.edit("css-editor");
    const jsEditor = ace.edit("js-editor");
    const previewFrame = document.getElementById('preview-frame');

    setupEditor(htmlEditor, "html");
    setupEditor(cssEditor, "css");
    setupEditor(jsEditor, "javascript");

    htmlEditor.setValue(`<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <style id="style-element"></style>
</head>
<body>
    <h1>Hello World!</h1>
    <script id="script-element" src=""></script>
</body>
</html>`);

    cssEditor.setValue(`h1 {
    color: #4a6ee0;
    font-family: Arial, sans-serif;
    text-align: center;
}`);

    jsEditor.setValue(`// Your JavaScript code here
document.querySelector('h1').addEventListener('click', function() {
    this.style.color = '#' + Math.floor(Math.random()*16777215).toString(16);
});`);

    const tabs = document.querySelectorAll('.tab:not(.view-tab)');
    const viewTab = document.querySelector('.view-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {

            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const language = this.getAttribute('data-language');
            document.querySelectorAll('.code-editor').forEach(editor => {
                editor.style.display = 'none';
            });
            document.getElementById(`${language}-editor`).style.display = 'block';

            previewFrame.style.display = 'none';
            viewTab.style.backgroundColor = '#f1f5f9';
        });
    });

    viewTab.addEventListener('click', function () {
        updatePreview();

        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.code-editor').forEach(editor => {
            editor.style.display = 'none';
        });

        previewFrame.style.display = 'block';
        this.style.backgroundColor = '#d1d5db';
    });

    document.getElementById('new-file').addEventListener('click', newFile);
    document.getElementById('save-file').addEventListener('click', showSaveModal);
    document.getElementById('open-file').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('download-file').addEventListener('click', downloadFile);
    document.getElementById('save-confirm').addEventListener('click', saveFile);
    document.getElementById('save-cancel').addEventListener('click', hideSaveModal);
    document.getElementById('file-input').addEventListener('change', openFile);

    let debounceTimer;
    [htmlEditor, cssEditor, jsEditor].forEach(editor => {
        editor.session.on('change', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updatePreview, 500);
        });
    });

    function setupEditor(editor, language) {
        editor.setTheme("ace/theme/chrome");
        editor.session.setMode(`ace/mode/${language}`);
        editor.setOptions({
            fontSize: "14px",
            showPrintMargin: false,
            tabSize: 2,
            useSoftTabs: true,
            wrap: true
        });
    }

    const toggle = document.getElementById("themeToggle");

    toggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");
        const theme = isDark ? "ace/theme/twilight" : "ace/theme/github";
        htmlEditor.setTheme(theme);
        cssEditor.setTheme(theme);
        jsEditor.setTheme(theme);

        [htmlEditor, cssEditor, jsEditor].forEach(editor => {
            editor.setHighlightActiveLine(true);
            editor.setSelectionStyle("line");

            const selectionColor = isDark ? "#2563eb55" : "#93c5fd55";
            const styleTag = document.createElement("style");
            styleTag.textContent = `
        .ace_editor .ace_marker-layer .ace_selection {
            background: ${selectionColor} !important;
        }
    `;
            document.head.appendChild(styleTag);
        });

    });


    function updatePreview() {
        const html = htmlEditor.getValue();
        const css = cssEditor.getValue();
        const js = jsEditor.getValue();

        const preview = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}</script>
            </body>
            </html>
        `;

        const blob = new Blob([preview], { type: 'text/html' });
        previewFrame.src = URL.createObjectURL(blob);
    }

    function newFile() {
        if (confirm('Are you sure you want to create a new file? All unsaved changes will be lost.')) {
            htmlEditor.setValue(`<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n\n</body>\n</html>`);
            cssEditor.setValue('');
            jsEditor.setValue('');
        }
    }

    function showSaveModal() {
        document.getElementById('file-name-input').style.display = 'flex';
    }

    function hideSaveModal() {
        document.getElementById('file-name-input').style.display = 'none';
    }

    function saveFile() {
        const fileName = document.getElementById('fileName').value.trim();
        const fileType = document.getElementById('fileType').value;

        if (!fileName) {
            alert('Please enter a filename');
            return;
        }

        let content, mimeType, fullFileName;

        switch (fileType) {
            case 'html':
                content = htmlEditor.getValue();
                mimeType = 'text/html';
                fullFileName = `${fileName}.html`;
                break;
            case 'css':
                content = cssEditor.getValue();
                mimeType = 'text/css';
                fullFileName = `${fileName}.css`;
                break;
            case 'js':
                content = jsEditor.getValue();
                mimeType = 'application/javascript';
                fullFileName = `${fileName}.js`;
                break;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fullFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        hideSaveModal();
    }

    function downloadFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const htmlContent = htmlEditor.getValue();
        const cssContent = cssEditor.getValue();
        const jsContent = jsEditor.getValue();

        const fullContent = `<!DOCTYPE html>
<html>
<head>
       <title>Project ${timestamp}</title>
    <style>
${cssContent}
    </style>
</head>
<body>
${htmlContent}
    <script>
${jsContent}
    </script>
</body>
</html>`;

        const blob = new Blob([fullContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `project-${timestamp}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function openFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;

            if (file.name.endsWith('.html')) {
                htmlEditor.setValue(content);

                const doc = new DOMParser().parseFromString(content, 'text/html');
                const styleElement = doc.querySelector('style');
                const scriptElement = doc.querySelector('script');

                if (styleElement) {
                    cssEditor.setValue(styleElement.textContent);
                }

                if (scriptElement && !scriptElement.src) {
                    jsEditor.setValue(scriptElement.textContent);
                }

                document.querySelector('.tab[data-language="html"]').click();
            } else if (file.name.endsWith('.css')) {
                cssEditor.setValue(content);
                document.querySelector('.tab[data-language="css"]').click();
            } else if (file.name.endsWith('.js')) {
                jsEditor.setValue(content);
                document.querySelector('.tab[data-language="js"]').click();
            }
        };
        reader.readAsText(file);
    }
});
