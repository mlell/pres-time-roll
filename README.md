# Classroom PDF Presenter

A classroom presentation tool with a PDF viewer and management tools (timer and student die).

## Features

- **PDF Viewer**: Drag-and-drop PDF files with page navigation
- **Timer**: Countdown timer with visual circle segments (12 segments)
  - Add time in 1, 3, or 5 minute increments
  - Initial time is saved when first set
  - Circle segments show proportional time remaining
  - Beep sound when timer reaches zero
- **Student Die**: Random student selection tool
  - Rapid cycling animation
  - Load custom student names from text file
- **Resizable Sidebar**: Drag to resize sidebar (200px-500px)
- **Persistence**: All state saved to localStorage

## Folder Structure

```
classtimer/
├── classtimer.html          # Main HTML file
├── package.json             # Project configuration and dependencies
├── lib/
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript modules
│   │   ├── Business logic modules (timer, die, storage)
│   │   ├── Main application logic (DOM interaction)
│   │   ├── Bundled JavaScript (generated during build)
│   │   ├── PDF.js library files (copied during build)
│   │   └── __tests__/       # Unit tests
├── node_modules/            # npm dependencies
├── tests.md                 # Manual testing checklist
└── README.md                # This file
```

## Build Process

The application uses a build process to bundle JavaScript modules for offline use and to enable direct file opening (file:// protocol).

### Prerequisites

- Node.js and npm installed

### Installation

```bash
npm install
```

This installs:
- `pdfjs-dist` - PDF rendering library
- `jest` - Testing framework
- `esbuild` - JavaScript bundler

### Build Commands

```bash
# Complete build (copy PDF.js files and bundle JavaScript)
npm run build

# Copy PDF.js library files to lib/js for offline use
npm run copy-pdfjs

# Bundle JavaScript modules into single file
npm run bundle
```

### How Build Works

1. **copy-pdfjs**: Copies PDF.js files from `node_modules/pdfjs-dist/build/` to `lib/js/`
   - `pdf.min.mjs` - Main PDF.js library
   - `pdf.worker.min.mjs` - PDF.js web worker

2. **bundle**: Uses esbuild to bundle all JavaScript modules
   - Entry point: `lib/js/app.js`
   - Output: `lib/js/bundle.js`
   - Format: IIFE (Immediately Invoked Function Expression)
   - Bundles: app.js, timerLogic.js, dieLogic.js, storageLogic.js
   - Excludes: pdfjs-dist (loaded separately)

### Running the Application

**After building**, open `classtimer.html` directly in a browser:
```bash
npm run build
# Then open classtimer.html in your browser
```

The bundled JavaScript and local PDF.js files allow the app to work with the file:// protocol without CORS errors.

## Development Workflow

### Code Organization

The codebase is separated into:
- **Business logic** (pure functions): Timer, die, and storage logic modules
- **DOM interaction**: Main application logic

This separation enables:
- Easy unit testing of business logic
- Clear separation of concerns
- Reusable logic modules

### Testing

```bash
# Run all unit tests
npm test
```

Tests are located in `lib/js/__tests__/` and use Jest. All business logic functions have comprehensive unit tests.

### Making Changes

1. Edit source files in `lib/js/`
2. Rebuild if needed: `npm run bundle`
3. Run tests: `npm test`
4. Open `classtimer.html` to test changes

### Adding New Features

1. Add business logic to appropriate logic module
2. Add DOM interaction to main application logic
3. Write unit tests for new logic functions
4. Update this README if needed

## Testing

### Unit Tests

Located in `lib/js/__tests__/`:
- Timer business logic tests
- Student die business logic tests
- Storage business logic tests

Run with: `npm test`


## Dependencies

### Production
- `pdfjs-dist` - PDF rendering library

### Development
- `jest` - Testing framework
- `@jest/globals` - Jest globals for ES modules
- `esbuild` - JavaScript bundler

## Usage

### Opening the Application

1. Build the project: `npm run build`
2. Open `classtimer.html` in a web browser

### Using the Tools

**PDF Viewer**:
- Drag and drop a PDF file onto the drop zone
- Or click the drop zone to select a file
- Use Previous/Next buttons to navigate pages
- Use "Präs. wechseln" to open a different PDF file
- Keyboard shortcuts:
  - Next page: `Space`, `Enter`, `→`, `PgDn`
  - Previous page: `Backspace`, `←`, `PgUp`

**Timer**:
- Click +1m, +3m, or +5m to add time
- Click Start to begin countdown
- Click Pause to stop
- Click Reset to clear timer
- Initial time is saved when first set
- Circle segments show proportional time remaining

**Student Die**:
- Click the die to select a random student
- Drop a text file (one name per line) onto the die to load custom students; the die then shows the file name (without extension) until a student is rolled
- After a student has been selected, the die returns to showing the file name after 15 seconds

**Sidebar**:
- Drag the handle between the PDF viewer and sidebar to resize
- Width is saved and persists across sessions

## Technical Details

- **PDF Rendering**: PDF.js library with canvas rendering
- **Timer Display**: CSS-based circle with 12 rounded segments
- **Audio**: Web Audio API for beep sound (no external files)
- **Storage**: localStorage for state persistence
- **Styling**: CSS Grid/Flexbox for responsive layout
- **JavaScript**: Vanilla JS with ES modules (bundled for production)

## License

MIT
