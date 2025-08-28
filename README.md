# Large Log File Streamer

A high-performance web application designed to stream, view, and search massive log files (gigabytes in size) directly from a URL without crashing your browser.


## The Problem

Standard log viewers, text editors, or even browser tabs often crash or become extremely unresponsive when attempting to open log files that are hundreds of megabytes or several gigabytes in size. This is because they try to load the entire file into memory at once.

This tool solves that problem by providing a robust, memory-efficient solution for developers, SREs, and support engineers who need to inspect large-scale application logs.

## Key Features

- **🚀 High-Performance Streaming**: Reads files chunk-by-chunk using the Fetch API's `ReadableStream`, ensuring low and constant memory usage regardless of file size.
- **⚡️ List Virtualization**: Renders only the visible portion of the log file to the DOM. This allows for incredibly smooth scrolling through millions of lines without UI lag.
- **🔍 Responsive Real-time Search**: Features a debounced search input that filters through massive datasets instantly, providing a fluid user experience.
- **📄 Line Detail View**: Click any log line to view its full, unwrapped content in a clean modal dialog—perfect for inspecting long, complex log entries.
- **🛑 Stream Control**: Cancel in-progress log downloads at any time to save bandwidth or correct a file selection.
- **⚙️ Configurable & Flexible**:
  - **Custom Server URL**: Set a custom base URL for your log server.
  - **Dual Input Modes**: Choose logs by date using a convenient picker (for structured naming conventions like `YYYY-MM-DD-backend.log`) or switch to manual input to type any filename directly.
  - **Real-time Stats**: Get live feedback on streamed data size, total lines, and filtered line counts.

## How It Works

The application achieves its performance through three core techniques:

1.  **Streaming**: Instead of a traditional `GET` request that downloads the whole file, it uses `fetch` to open a `ReadableStream` to the file's content. It processes the data in small chunks, decodes them into text, and splits them into lines. This means the entire file is never held in the browser's memory.
2.  **Virtualization**: To avoid rendering tens of thousands of DOM elements (which would crash the browser), the UI calculates which lines should be visible in the viewport based on scroll position. It then renders only those few dozen lines, creating a "virtual" window that moves over the dataset.
3.  **Debouncing**: The search input waits for a brief pause in typing (e.g., 300ms) before triggering the filter function. This prevents the app from re-filtering millions of lines on every single keystroke, which would cause significant input lag.

## Tech Stack

- **React**: For building the user interface.
- **TypeScript**: For type safety and improved code quality.
- **Tailwind CSS**: For rapid, utility-first styling.

## How to Use

1.  **Configure the URL**: In the "Log Server URL" field, enter the base URL where your log files are hosted. Click "Edit" to change it. This URL is saved locally in your browser.
2.  **Select a File**: Choose your input method:
    -   **By Date**: Use the date picker to automatically construct a filename based on a `YYYY-MM-DD-backend-logs.json` naming convention.
    -   **Manual Input**: Switch the toggle to manually type the exact filename you need.
3.  **View the Log**: Click "View Log" to begin streaming.
4.  **Search**: Use the search bar at the top right to filter the content in real-time.
5.  **Inspect a Line**: Click on any truncated line in the viewer to open a modal and see its full content.

## ❗️ IMPORTANT: Server-side Requirements

For this application to work, your log server **must** be configured correctly. If you encounter errors, it is almost certainly a server-side issue.

1.  **CORS (Cross-Origin Resource Sharing)**: The server hosting the log files must allow requests from the domain where this web app is running. This is a security feature built into browsers.
    -   **Solution**: The server must include the `Access-Control-Allow-Origin: *` or `Access-Control-Allow-Origin: <URL_OF_THIS_APP>` header in its HTTP responses.
2.  **Direct File Access**: The log files must be directly accessible via a URL. The application constructs a URL like `[Your Base URL]/[File Name]` and expects to receive the raw log file content.