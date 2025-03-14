# Create HTML page from gdoc

<p> While Google Docs offers a built-in "Publish to Web" feature, it doesn't support tab navigation in the published output and doesn't allow custom CSS styling. This tool bridges that gap by providing a complete conversion solution with full control over the output.</p>

<p>
This web application converts Google Docs documents with tabs and nested tabs into responsive HTML websites with an interactive navigation system. The document's tab structure is transformed into a sidebar menu on desktop or a dropdown menu on mobile, allowing easy navigation between sections.
</p>

<div align="center">
  <img src="https://img.shields.io/badge/Google%20Docs-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Docs">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
</div>

## ✨ Features

<div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
  <div style="flex: 1; min-width: 300px; background-color: #fff3e0; padding: 15px; border-radius: 8px; border: 1px solid #ffe0b2;">
    <h3 style="color: #ff9800;">📦 Distribution Options</h3>
    <ul>
      <li>Online viewing of the generated site (if enabled)</li>
      <li>Download the complete site as a ZIP archive</li>
      <li>Easy to deploy on any web hosting</li>
    </ul>
  </div>
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
3. Ensure the `assets` directory has write permissions (for storing credentials.json)
4. Access the administration page (`admin.html`) to configure your Google API credentials:
   - Default admin password is "admin"
   - Follow the instructions to obtain Google API credentials from the [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Drive API and Google Docs API
   - Create OAuth credentials (Web application type)
   - Configure authorized JavaScript origins with your domain name (e.g., `https://yourdomain.com`)
   - No need to configure redirect URIs as the application runs entirely client-side
   - Create an API Key and properly restrict it
   - Save these credentials in the admin interface

## 🔧 Administration

<div style="background-color: #fafafa; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e0e0e0;">
  <h3 style="color: #424242;">Configuring Storage Options</h3>
  <p>Access the administration page to configure how the application handles generated sites:</p>
  <ol>
    <li>Go to <code>admin.html</code> and log in with your admin password</li>
    <li>Scroll down to the "Server Storage Settings" section</li>
    <li>Enable or disable server storage as needed:
      <ul>
        <li><strong>Disabled (default):</strong> Client-only mode with ZIP downloads</li>
        <li><strong>Enabled:</strong> Both server storage and ZIP downloads available</li>
      </ul>
    </li>
    <li>When enabled, configure the storage limits:
      <ul>
        <li>Maximum sites per IP address</li>
        <li>Maximum total sites stored on server</li>
        <li>Maximum size per site (in MB)</li>
        <li>Auto-delete period (in days)</li>
      </ul>
    </li>
    <li>Click "Save Settings" to apply changes</li>
  </ol>
</div>

## 🚀 Usage

<div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #dadce0;">
<ol>
  <li>Open the application in your web browser</li>
  <li>Authentication with Google happens when you click the "Pick a file from Google Drive" button</li>
  <li>Enter a Google Doc URL directly or use the picker to select a document</li>
  <li>Click "Convert Google Doc to HTML" to process the document</li>
  <li>A loading animation indicates the conversion is in progress</li>
  <li>Once the conversion is complete, you have two options:
    <ul>
      <li>Click "View Generated Site" to open the site in a new tab</li>
      <li>Click "Download as ZIP" to download the complete site as an archive</li>
    </ul>
  </li>
  <li>Navigate through the document sections using the generated tab menu</li>
</ol>
</div>

## 🚀 Usage Options

### Client-Only Mode (Default)

<div style="background-color: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #4285f4;">
  <p>By default, the application operates in Client-Only Mode with these characteristics:</p>
  <ul>
    <li>All processing happens entirely in your browser</li>
    <li>Generated sites are only available for download as ZIP files</li>
    <li><strong>No files are stored on the server</strong>, preserving server resources</li>
    <li>Perfect for public deployments or environments with limited storage</li>
  </ul>
</div>

### Server Storage Mode (Optional)

<div style="background-color: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ffa000;">
  <p>For situations where you want to host the generated sites on the server:</p>
  <ul>
    <li>Enable this mode in the administration interface</li>
    <li>Generated sites are stored on the server and accessible via direct URLs</li>
    <li>Sites can be both viewed online and downloaded as ZIP files</li>
    <li>Configurable limits prevent server storage exhaustion</li>
    <li>Automatic cleanup removes unused sites after a specified period</li>
  </ul>
</div>

## 📊 Storage Management

To prevent server storage saturation when enabling Server Storage Mode, the application includes several safeguards:

<div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
  <div style="flex: 1; min-width: 300px; background-color: #fce4ec; padding: 15px; border-radius: 8px; border: 1px solid #f48fb1;">
    <h3 style="color: #c2185b;">📋 Configurable Limits</h3>
    <ul>
      <li><strong>Sites per IP:</strong> Maximum number of sites one user can create</li>
      <li><strong>Total sites:</strong> Maximum number of sites allowed on the server</li>
      <li><strong>Site size:</strong> Maximum allowed size for each generated site</li>
      <li><strong>Retention period:</strong> Days before automatic site deletion</li>
    </ul>
  </div>
  
  <div style="flex: 1; min-width: 300px; background-color: #e0f2f1; padding: 15px; border-radius: 8px; border: 1px solid #80cbc4;">
    <h3 style="color: #00897b;">🧹 Automatic Cleanup</h3>
    <ul>
      <li>The <code>cleanup.php</code> script automatically removes sites exceeding the retention period</li>
      <li>Can be scheduled as a cron job for automated maintenance</li>
      <li>Helps prevent storage exhaustion on long-running deployments</li>
      <li>Example cron entry: <code>0 0 * * * php /path/to/create_html_from_gdoc/cleanup.php</code></li>
    </ul>
  </div>
</div>

## 📂 File Structure

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background-color: #f5f7fa;">
    <th style="padding: 10px; border: 1px solid #dadce0; text-align: left;">File/Directory</th>
    <th style="padding: 10px; border: 1px solid #dadce0; text-align: left;">Description</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>index.html</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Main application interface</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>admin.html</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Administration interface for managing API credentials and settings</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>fonctions.js</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Main JavaScript file with all conversion logic</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>get_config.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Script to retrieve API configuration</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>update_config.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Unified script to save both API credentials and application settings</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>create_zip_from_memory.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Script to generate downloadable ZIP archives of converted sites</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>cleanup.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Maintenance script to remove expired sites</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>assets/</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Directory containing application assets, including credentials.json (requires write permission)</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>assets/credentials.json</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">File storing API credentials (protected from direct access)</td>
  </tr>
  <tr style="background-color: #f5f7fa;">
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>output/</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Directory for generated sites (requires write permission)</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #dadce0;"><code>config.php</code></td>
    <td style="padding: 8px; border: 1px solid #dadce0;">Application configuration file</td>
  </tr>
</table>

## ⚙️ How It Works

<div style="margin: 20px 0;">
<div style="display: flex; align-items: center; padding: 8px 0;">

<div style="background-color: #f0f8ff; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 5px solid #4285f4;">
<p><strong>Client-Side Processing:</strong> All Google Doc parsing and HTML generation code runs entirely in the client's browser. This approach ensures your document content remains private between your browser and Google's servers, with no intermediate storage on our server.</p>
</div>

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

<div style="background-color: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #4285f4;">
 
  <h4 style="color: #4285f4;">Default Styling</h4>
  <p>Modify the default CSS styling for all generated sites by editing the <code>styles.css</code> file</p>
  
  <h4 style="color: #4285f4;">Per-Site Styling</h4>
  <p>Each generated site contains its own copy of the CSS file that can be customized individually</p>

</div>

## ⚠️ Troubleshooting

<div style="background-color: #fce8e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ea4335;">
  <h4 style="color: #ea4335; margin-top: 0;">Authentication Issues</h4>
  <p>Ensure your Google API credentials are correct and have the necessary permissions</p>
  <p>Make sure  "Authorized JavaScript origins" is properly configured in your Google Cloud Console</p>
  
  <h4 style="color: #ea4335;">Authentication Error on Production Server</h4>
  <p>If you receive "Failed to open popup window" errors, check that your domain is added to the JavaScript origins URIs in the OAuth client settings</p>
  
  <h4 style="color: #ea4335;">Administration Access</h4>
  <p>If you've lost your admin password, delete the credentials.json file in the assets directory and access admin.html again to reset with the default password "admin"</p>
   
  <h4 style="color: #ea4335;">Write Permission Errors</h4>
  <p>Verify that the web server has write permissions to the output directory</p>
  
  <h4 style="color: #ea4335;">ZIP Download Issues</h4>
  <p>Ensure the tmp directory exists and has proper write permissions</p>
</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Credits

- Uses Google Drive API and Google Docs API
- Icons provided by Material Design

<div align="center" style="margin-top: 40px; color: #5f6368;">
  <p>Made with ❤️ for Google Docs users</p>
</div>
