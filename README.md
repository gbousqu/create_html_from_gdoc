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
  <h3 style="color: #f4b400;">
    <img src="assets/google-drive-logo.png" width="24" height="24" style="vertical-align: middle; margin-right: 5px;"> Google Drive Integration
  </h3>
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
3. Access the administration page (`admin.html`) to configure your Google API credentials:
   - Default admin password is "admin"
   - Follow the instructions to obtain Google API credentials from the [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Drive API and Google Docs API
   - Create OAuth credentials (Web application type)
   - Create an API Key and properly restrict it
   - Save these credentials in the admin interface

## 🚀 Usage

<div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #dadce0;">
<ol>
  <li>Open the application in your web browser</li>
  <li>Authenticate with your Google account</li>
  <li>Enter a Google Doc URL or use the picker to select a document</li>
  <li>Click "Generate HTML Site" to process the document</li>
  <li>The generated site will open in a new tab and can be found in the <code>output</code> directory</li>
  <li>Navigate through the document sections using the generated tab menu</li>
</ol>
</div>

## 📂 File Structure

<tr>
  <td style="padding: 8px; border: 1px solid #dadce0;"><code>admin.html</code></td>
  <td style="padding: 8px; border: 1px solid #dadce0;">Administration interface for managing API credentials</td>
</tr>
<tr style="background-color: #f5f7fa;">
  <td style="padding: 8px; border: 1px solid #dadce0;"><code>get_config.php</code></td>
  <td style="padding: 8px; border: 1px solid #dadce0;">Script to retrieve API configuration</td>
</tr>
<tr>
  <td style="padding: 8px; border: 1px solid #dadce0;"><code>save_config.php</code></td>
  <td style="padding: 8px; border: 1px solid #dadce0;">Script to save API configuration</td>
</tr>
<tr style="background-color: #f5f7fa;">
  <td style="padding: 8px; border: 1px solid #dadce0;"><code>assets/credentials.json</code></td>
  <td style="padding: 8px; border: 1px solid #dadce0;">File storing API credentials (protected from direct access)</td>
</tr>

## ⚙️ How It Works

<div style="margin: 20px 0;">
<div style="display: flex; align-items: center; padding: 8px 0;">
  <div style="background-color: #4285f4; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">1</div>
  <div>The application loads API credentials from the server configuration and authenticates with Google APIs using OAuth 2.0</div>
</div>
  
  <div style="display: flex; align-items: center; padding: 8px 0;">
    <div style="background-color: #34a853; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">2</div>
    <div>It fetches the selected document's content via the Google Docs API</div>
  </div>
  
  <div style="display: flex; align-items: center; padding: 8px 0;">
    <div style="background-color: #fbbc05; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">3</div>
    <div>The document's tab structure is analyzed and converted to a navigation hierarchy</div>
  </div>
  
  <div style="display: flex; align-items: center; padding: 8px 0;">
    <div style="background-color: #ea4335; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">4</div>
    <div>The document structure is parsed, including headings, lists, tables, and embedded objects</div>
  </div>
  
  <div style="display: flex; align-items: center; padding: 8px 0;">
    <div style="background-color: #673ab7; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">5</div>
    <div>Images and other embedded content are downloaded and converted for local use</div>
  </div>
  
  <div style="display: flex; align-items: center; padding: 8px 0;">
    <div style="background-color: #0f9d58; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">6</div>
    <div>A responsive HTML site is generated with CSS styling and JavaScript for tab navigation</div>
  </div>
  
  <div style="display: flex; align-items: center; padding: 8px 0;">
    <div style="background-color: #795548; color: white; min-width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">7</div>
    <div>The site files are saved to the output directory with a folder name based on the document title</div>
  </div>
</div>

## 🎨 Customization

  <p>Adjust tab navigation behavior by editing the JavaScript in the HTML template</p>
</div>

## ⚠️ Troubleshooting

<div style="background-color: #fce8e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ea4335;">
  <h4 style="color: #ea4335; margin-top: 0;">Authentication Issues</h4>
  <p>Ensure your Google API credentials are correct and have the necessary permissions</p>
    <h4 style="color: #ea4335;">Administration Access</h4>
  <p>If you've lost your admin password, delete the credentials.json file in the assets directory and access admin.html again to reset with the default password "admin"</p>

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
