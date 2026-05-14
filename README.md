# InkShelf

InkShelf is a local reading, writing, and reflection workspace. It lets you:

- save book excerpts inside book folders
- write while comparing your text against saved excerpts
- talk through a theme with AI and turn the conversation into a polished short piece
- search across excerpts and drafts
- rewrite drafts into different tones with AI

## Project Structure

- `index.html`, `styles.css`, `app.js`: front-end app
- `server.js`: local web server and OpenAI proxy
- `electron/`: desktop wrapper

## Run In Browser

1. Copy `.env.example` to `.env` if you want a local reference file.
2. Export your key in the shell:

```bash
export OPENAI_API_KEY="your_key"
export OPENAI_MODEL="gpt-5"
```

3. Start the local server:

```bash
npm run start:web
```

4. Open `http://127.0.0.1:3000`.

## Run As Desktop App

1. Install dependencies:

```bash
npm install
```

2. Launch Electron:

```bash
npm run start:desktop
```

This starts the local server inside Electron and opens InkShelf as a desktop app window.

## Upload To GitHub

```bash
git init
git add .
git commit -m "Build InkShelf desktop prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inkshelf.git
git push -u origin main
```

## Next Step To Ship A Real App

For a real distributable desktop app, the next practical step is:

1. add an Electron packager such as `electron-builder`
2. create signed macOS builds
3. move local browser storage into a file or database layer
4. add secure `.env` loading for production
