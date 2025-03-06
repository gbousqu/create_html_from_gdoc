# Create HTML page from gdoc

A web application that converts Google Docs documents with tabs and nested tabs into responsive HTML websites with an interactive navigation system. The document's tab structure is transformed into a sidebar menu on desktop or a dropdown menu on mobile, allowing easy navigation between sections.

## Features

- **Smart Tab Navigation**: Converts Google Docs tabs and sub-tabs into an intuitive navigation system:

  - Sidebar navigation on desktop devices
  - Collapsible top menu on mobile devices
  - Preserves parent-child relationships between tabs
  - One-click navigation between document sections

- **Google Docs Integration**: Authenticate with Google APIs and access your documents directly
  - Document Selection: Choose documents via URL or integrated Google Picker
- **Rich Content Conversion**:

  - Headings, paragraphs, and text formatting
  - Lists (ordered and unordered) with proper nesting
  - Tables with formatting
  - Images with original dimensions
  - Richlinks to Google Drive files with appropriate icons
  - Table of contents

- **Responsive Design**:
  - Mobile-friendly output with adaptive navigation
  - Tab navigation transforms based on screen size
- **Asset Management**: Saves and optimizes images from the document

## Requirements

- Web server with PHP support (e.g., Apache)
- Google API credentials (Client ID and API Key)
- Write permissions on the output directory

## Installation

1. Clone or download this repository to your web server's public directory
2. Ensure the `output` directory exists and has write permissions
3. Obtain Google API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Drive API and Google Docs API
   - Create OAuth credentials (Web application type)
   - Note your Client ID and API Key

## Usage

1. Open the application in your web browser
2. Enter your Google API credentials (they will be saved in your browser's local storage)
3. Authenticate with your Google account
4. Enter a Google Doc URL or use the picker to select a document
5. Click "Generate HTML Site" to process the document
6. The generated site will open in a new tab and can be found in the `output` directory
7. Navigate through the document sections using the generated tab menu

## File Structure

- `index.html`: Main application interface
- `fonctions.js`: Core JavaScript functionality for Google API integration and document processing
- `styles.css`: Stylesheet for the application interface
- `output/`: Directory where generated sites are stored
- `proxy_googlecontent.php`: Proxy for fetching Google content
- `save_file.php`, `save_image.php`: Helper scripts for saving generated files
- `list_images.php`: Script to list existing images for reuse
- `get_base_url.php`: Script to determine the base URL of the application
- `create_folders.php`: Script to create output folders

## How It Works

1. The application authenticates with Google APIs using OAuth 2.0
2. It fetches the selected document's content via the Google Docs API
3. The document's tab structure is analyzed and converted to a navigation hierarchy
4. The document structure is parsed, including headings, lists, tables, and embedded objects
5. Images and other embedded content are downloaded and converted for local use
6. A responsive HTML site is generated with CSS styling and JavaScript for tab navigation
7. The site files are saved to the output directory with a folder name based on the document title

## Customization

- Edit the generated `styles.css` file in the output directory to change site appearance
- Adjust tab navigation behavior by editing the JavaScript in the HTML template

## Troubleshooting

- **Authentication Issues**: Ensure your Google API credentials are correct and have the necessary permissions
- **Image Loading Problems**: Check that the proxy script can access Google's servers
- **Write Permission Errors**: Verify that the web server has write permissions to the output directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Uses Google Drive API and Google Docs API
- Icons provided by Material Design
