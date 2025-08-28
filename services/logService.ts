import { LogFile } from '../types';

/**
 * Attempts to fetch and parse an HTML directory listing from the given URL.
 * IMPORTANT: This function is highly dependent on the server at `baseUrl` having
 * directory listing enabled and allowing cross-origin requests (CORS).
 * Most modern web servers have directory listing disabled by default for security,
 * and browsers will block requests to different origins unless the server explicitly
 * permits it via CORS headers.
 * If this fails, it's almost certainly a server configuration issue, not a client-side bug.
 * @param baseUrl The base URL of the log server, which should return an HTML directory index.
 */
export const fetchLogFiles = async (baseUrl: string): Promise<LogFile[]> => {
  console.log(`Attempting real file listing from: ${baseUrl}`);
  
  if (!baseUrl.startsWith('http')) {
    return [{ name: "Error: Invalid URL format. It must start with http:// or https://" }];
  }

  try {
    const response = await fetch(baseUrl);

    if (!response.ok) {
      throw new Error(`Network response was not ok. Status: ${response.status} ${response.statusText}`);
    }
    
    const htmlText = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    
    const fileNames = links
      .map(link => link.getAttribute('href'))
      .filter((href): href is string => {
        if (!href) return false;
        // Ignore parent directory links, query string links, directory links, and anchor links
        const isParentDir = href === '../';
        const isQueryLink = href.startsWith('?');
        const isDirectory = href.endsWith('/');
        const isAnchorLink = href.startsWith('#');
        return !isParentDir && !isQueryLink && !isDirectory && !isAnchorLink;
      })
      .map(href => decodeURIComponent(href));

    if (fileNames.length === 0) {
        console.log("Info: No files found in directory listing, or the directory is empty.");
    }

    return fileNames.map(name => ({ name }));

  } catch (error: any) {
    console.error("Error fetching or parsing log file list:", error);
    let formattedUrl = baseUrl;
    try {
      formattedUrl = new URL(baseUrl).origin;
    } catch (_) {
      // Ignore if baseUrl is not a valid URL
    }
    // Provide a detailed, user-friendly error message explaining the likely causes.
    return [{ name: `Error: Could not fetch file list from '${baseUrl}'. This is likely a server-side issue.
1. **CORS Policy**: The server is not configured to allow requests from this web app. Check the browser's developer console (F12) for CORS errors.
2. **Network Error**: Could not connect to the server.
3. **No Directory Listing**: The server may not have directory listing enabled.
(Technical details: ${error.message})` }];
  }
};