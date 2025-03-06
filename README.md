# Create HTML page from gdoc

<div style="background-color: #f5f7fa; border-radius: 10px; padding: 20px; margin-bottom: 30px; border-left: 5px solid #4285f4;">
A web application that converts Google Docs documents with tabs and nested tabs into responsive HTML websites with an interactive navigation system. The document's tab structure is transformed into a sidebar menu on desktop or a dropdown menu on mobile, allowing easy navigation between sections.
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Google%20Docs-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Docs">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
</div>

## ✨ Features

<div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
  <div style="flex: 1; min-width: 300px; background-color: #e8f0fe; padding: 15px; border-radius: 8px; border: 1px solid #d0e1fd;">
    <h3 style="color: #4285f4;">📊 Smart Tab Navigation</h3>
    <ul>
      <li>Sidebar navigation on desktop devices</li>
      <li>Collapsible top menu on mobile devices</li>
      <li>Preserves parent-child relationships between tabs</li>
      <li>One-click navigation between document sections</li>
    </ul>
  </div>
  
  <div style="flex: 1; min-width: 300px; background-color: #fef9e6; padding: 15px; border-radius: 8px; border: 1px solid #feefc3;">
    <h3 style="color: #f4b400;">🔌 Google Docs Integration</h3>
    <ul>
      <li>Authenticate with Google APIs</li>
      <li>Access your documents directly</li>
      <li>Choose documents via URL or integrated Google Picker</li>
    </ul>
  </div>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
  <div style="flex: 1; min-width: 300px; background-color: #e6f4ea; padding: 15px; border-radius: 8px; border: 1px solid #ceead6;">
    <h3 style="color: #34a853;">📝 Rich Content Conversion</h3>
    <ul>
      <li>Headings, paragraphs, and text formatting</li>
      <li>Lists (ordered and unordered) with proper nesting</li>
      <li>Tables with formatting</li>
      <li>Images with original dimensions</li>
      <li>Richlinks to Google Drive files with appropriate icons</li>
      <li>Table of contents</li>
    </ul>
  </div>
  
  <div style="flex: 1; min-width: 300px; background-color: #fce8e6; padding: 15px; border-radius: 8px; border: 1px solid #fad2cf;">
    <h3 style="color: #ea4335;">📱 Responsive Design</h3>
    <ul>
      <li>Mobile-friendly output</li>
      <li>Adaptive navigation</li>
      <li>Tab navigation transforms based on screen size</li>
      <li>Image optimization for various devices</li>
    </ul>
  </div>
</div>

## 🛠️ Requirements

- Web server with PHP support (e.g., Apache)
- Google API credentials (Client ID and API Key)
- Write permissions on the output directory

## 📦 Installation

1. Clone or download this repository to your web server's public directory
2. Ensure the `output` directory exists and has write permissions
3. Obtain Google API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Drive API and Google Docs API
   - Create OAuth credentials (Web application type)
   - Note your Client ID and API Key

## 🚀 Usage

<div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #dadce0;">
<ol>
  <li>Open the application in your web browser</li>
  <li>Enter your Google API credentials (they will be saved in your browser's local storage)</li>
  <li>Authenticate with your Google account</li>
  <li>Enter a Google Doc URL or use the picker to select a document</li>
  <li>Click "Generate HTML Site" to process the document</li>
  <li>The generated site will open in a new tab and can be found in the <code>output</code> directory</li>
  <li>Navigate through the document sections using the generated tab menu</li>
</ol>
</div>

## 📂 File Structure

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background-color: #4285f4; color: white;">
    <th style="padding: 10px; text-align: left;">File</th>
    <th style="padding: 10px; text-align: left;">Description</th>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>index.html</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Main application interface</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>fonctions.js</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Core JavaScript functionality for Google API integration and document processing</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>styles.css</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Stylesheet for the application interface</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>output/</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Directory where generated sites are stored</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>proxy_googlecontent.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Proxy for fetching Google content</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>save_file.php</code>, <code>save_image.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Helper scripts for saving generated files</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>list_images.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Script to list existing images for reuse</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>get_base_url.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Script to determine the base URL of the application</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>create_folders.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Script to create output folders</td>
  </tr>
</table>

## ⚙️ How It Works

<div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #4285f4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
    <div>The application authenticates with Google APIs using OAuth 2.0</div>
  </div>
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #34a853; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
    <div>It fetches the selected document's content via the Google Docs API</div>
  </div>
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #fbbc05; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
    <div>The document's tab structure is analyzed and converted to a navigation hierarchy</div>
  </div>
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #ea4335; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">4</div>
    <div>The document structure is parsed, including headings, lists, tables, and embedded objects</div>
  </div>
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #673ab7; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">5</div>
    <div>Images and other embedded content are downloaded and converted for local use</div>
  </div>
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #0f9d58; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">6</div>
    <div>A responsive HTML site is generated with CSS styling and JavaScript for tab navigation</div>
  </div>
  <div style="display: flex; align-items: center; gap: 15px;">
    <div style="background-color: #795548; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">7</div>
    <div>The site files are saved to the output directory with a folder name based on the document title</div>
  </div>
</div>

## 🎨 Customization

<div style="background-color: #e8eaed; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h4 style="margin-top: 0;">Style Customization</h4>
  <p>Edit the generated <code>styles.css</code> file in the output directory to change site appearance</p>
  
  <h4>Behavior Customization</h4>
  <p>Adjust tab navigation behavior by editing the JavaScript in the HTML template</p>
</div>

## ⚠️ Troubleshooting

<div style="background-color: #fce8e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ea4335;">
  <h4 style="color: #ea4335; margin-top: 0;">Authentication Issues</h4>
  <p>Ensure your Google API credentials are correct and have the necessary permissions</p>
  
  <h4 style="color: #ea4335;">Image Loading Problems</h4>
  <p>Check that the proxy script can access Google's servers</p>
  
  <h4 style="color: #ea4335;">Write Permission Errors</h4>
  <p>Verify that the web server has write permissions to the output directory</p>
</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Credits

- Uses Google Drive API and Google Docs API
- Icons provided by Material Design

<div align="center" style="margin-top: 40px; color: #5f6368;">
  <p>Made with ❤️ for Google Docs users</p>
</div>
