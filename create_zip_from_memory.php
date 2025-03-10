<?php
// Enable error reporting for debugging
ini_set('log_errors', 1);
ini_set('error_log', 'error.log');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  error_log("Error: Invalid request method: " . $_SERVER['REQUEST_METHOD']);
  http_response_code(405);
  exit('Method not allowed');
}

// Get the post data
$htmlContent = isset($_POST['html_content']) ? $_POST['html_content'] : null;
$docTitle = isset($_POST['doc_title']) ? $_POST['doc_title'] : 'document';
$imageData = isset($_POST['image_data']) ? $_POST['image_data'] : '{}';

error_log("Document title: " . $docTitle);
error_log("HTML content length: " . (strlen($htmlContent ?? '') > 0 ? strlen($htmlContent) : 'Empty'));
error_log("Image data length: " . strlen($imageData));

if (!$htmlContent) {
  error_log("Error: Missing HTML content");
  http_response_code(400);
  exit('Missing HTML content');
}

// Generate sanitized folder name for the ZIP structure
$sanitizedTitle = strtolower(preg_replace('/[^a-z0-9\s-]/', '', $docTitle));
$sanitizedTitle = preg_replace('/\s+/', '-', $sanitizedTitle);
$sanitizedTitle = preg_replace('/-+/', '-', $sanitizedTitle);
$sanitizedTitle = trim($sanitizedTitle);
$folderName = $sanitizedTitle ?: 'document';
error_log("Sanitized folder name: " . $folderName);

// Create a temporary directory for the ZIP content
$tempDir = sys_get_temp_dir() . '/' . uniqid('gdoc_');
error_log("Temp directory: " . $tempDir);
if (!mkdir($tempDir, 0755, true)) {
  error_log("Error: Failed to create temporary directory");
  http_response_code(500);
  exit('Failed to create temporary directory');
}

// Create images directory
$imagesDir = $tempDir . '/images';
error_log("Images directory: " . $imagesDir);
if (!mkdir($imagesDir, 0755, true)) {
  error_log("Error: Failed to create images directory");
  http_response_code(500);
  exit('Failed to create images directory');
}

// Save the HTML file
if (file_put_contents($tempDir . '/index.html', $htmlContent)) {
  error_log("HTML file created successfully");
} else {
  error_log("Error: Failed to create HTML file");
}

// Copy the CSS file from the output directory
$cssTemplate = __DIR__ . '/output/styles.css';
error_log("Looking for CSS template at: " . $cssTemplate . " - Exists: " . (file_exists($cssTemplate) ? 'Yes' : 'No'));
if (file_exists($cssTemplate)) {
  if (copy($cssTemplate, $tempDir . '/styles.css')) {
    error_log("CSS file copied successfully");
  } else {
    error_log("Error: Failed to copy CSS file");
  }
} else {
  // Create a minimal CSS file if the template doesn't exist
  if (file_put_contents($tempDir . '/styles.css', "/* Default styles */\nbody { font-family: Arial, sans-serif; }")) {
    error_log("Default CSS file created successfully");
  } else {
    error_log("Error: Failed to create default CSS file");
  }
}

// Process and save images from the image data
$hasImages = false;
$imageData = json_decode($imageData, true);
error_log("Image data decoded: " . (is_array($imageData) ? 'Yes (Array)' : 'No (Not an array)'));
if (is_array($imageData)) {
  error_log("Number of image entries: " . count($imageData));

  foreach ($imageData as $id => $image) {
    error_log("Processing image ID: " . $id . " - Type: " . ($image['type'] ?? 'undefined'));

    if (isset($image['type']) && $image['type'] === 'image') {
      if (isset($image['base64'])) {
        $hasImages = true;
        $base64String = $image['base64'];
        $base64Length = strlen($base64String);
        error_log("Image has base64 data - Length: " . $base64Length . " - Starts with: " . substr($base64String, 0, 30) . "...");

        // Extract the MIME type
        $matches = [];
        $hasMimeMatch = preg_match('/data:image\/([a-zA-Z0-9]+);base64,/', $base64String, $matches);
        $extension = $hasMimeMatch && isset($matches[1]) ? $matches[1] : 'png';
        error_log("Detected image extension: " . $extension . " - Regex match: " . ($hasMimeMatch ? 'Yes' : 'No'));

        // Remove the base64 header
        $base64String = preg_replace('/data:image\/[a-zA-Z0-9]+;base64,/', '', $base64String);
        error_log("Base64 header removed - New length: " . strlen($base64String));

        // Save the image
        $imageContent = base64_decode($base64String);
        if ($imageContent !== false) {
          $imagePath = $imagesDir . '/' . $id . '.' . $extension;
          $writeResult = file_put_contents($imagePath, $imageContent);
          if ($writeResult !== false) {
            error_log("Image saved successfully: " . $imagePath . " - Size: " . $writeResult . " bytes");
          } else {
            error_log("Error: Failed to write image file: " . $imagePath);
          }
        } else {
          error_log("Error: Failed to decode base64 data for image: " . $id);
        }
      } else {
        error_log("Warning: Image entry has no base64 data: " . $id);
      }
    }
  }
} else {
  error_log("Warning: Image data is not a valid array");
}

error_log("Images processed - Has images: " . ($hasImages ? 'Yes' : 'No'));

// Create the ZIP file
$zipFile = tempnam(sys_get_temp_dir(), 'zip_');
error_log("ZIP file path: " . $zipFile);

if (file_exists($zipFile)) {
  unlink($zipFile);
  error_log("Removed existing ZIP file");
}

$zip = new ZipArchive();
$zipResult = $zip->open($zipFile, ZipArchive::CREATE);
if ($zipResult !== true) {
  error_log("Error: Failed to create ZIP file - Error code: " . $zipResult);
  http_response_code(500);
  exit('Failed to create ZIP file');
}
error_log("ZIP archive created successfully");

// Listing all files in temp directory for debugging
error_log("Listing all files in temp directory:");
$allFiles = new RecursiveIteratorIterator(
  new RecursiveDirectoryIterator($tempDir, RecursiveDirectoryIterator::SKIP_DOTS),
  RecursiveIteratorIterator::SELF_FIRST
);
foreach ($allFiles as $file) {
  $relativePath = substr($file->getRealPath(), strlen($tempDir) + 1);
  $type = $file->isDir() ? "Directory" : "File";
  $size = $file->isDir() ? "-" : $file->getSize() . " bytes";
  error_log("  {$type}: {$relativePath} - Size: {$size}");
}

// Add files to the ZIP with the correct structure
error_log("Adding files to ZIP:");
$iterator = new RecursiveIteratorIterator(
  new RecursiveDirectoryIterator($tempDir, RecursiveDirectoryIterator::SKIP_DOTS),
  RecursiveIteratorIterator::LEAVES_ONLY
);

foreach ($iterator as $file) {
  if (!$file->isDir()) {
    $filePath = $file->getRealPath();

    // Normaliser les séparateurs de chemin pour éviter les problèmes sous Windows
    $relativePath = str_replace('\\', '/', substr($filePath, strlen($tempDir) + 1));

    error_log("Adding file: Real path = {$filePath}");
    error_log("Adding file: Relative path in ZIP = {$relativePath}");

    $addResult = $zip->addFile($filePath, $relativePath);
    error_log("  Adding file to ZIP: {$relativePath} - Result: " . ($addResult ? 'Success' : 'Failed'));
  }
}

// Make sure the images directory exists in the ZIP if needed
if (!$hasImages) {
  // Only add empty directory if it's needed
  $addDirResult = $zip->addEmptyDir('images');
  error_log("Adding empty images directory to ZIP - Result: " . ($addDirResult ? 'Success' : 'Failed'));
}

$zipCloseResult = $zip->close();
error_log("ZIP file closed - Result: " . ($zipCloseResult ? 'Success' : 'Failed'));

// Verify ZIP contents
$verifyZip = new ZipArchive();
if ($verifyZip->open($zipFile) === true) {
  error_log("Verifying ZIP contents - Number of entries: " . $verifyZip->numFiles);
  for ($i = 0; $i < $verifyZip->numFiles; $i++) {
    $stat = $verifyZip->statIndex($i);
    if ($stat) {
      error_log("  ZIP entry: " . $stat['name'] . " - Size: " . $stat['size'] . " bytes");
    }
  }
  $verifyZip->close();
} else {
  error_log("Error: Could not open ZIP file for verification");
}

// Set headers for file download
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $folderName . '.zip"');
header('Content-Length: ' . filesize($zipFile));
header('Pragma: no-cache');
header('Expires: 0');

// Output the ZIP file
error_log("Sending ZIP file to user - Size: " . filesize($zipFile) . " bytes");
readfile($zipFile);

// Clean up
unlink($zipFile);
error_log("Temporary ZIP file deleted");

// Delete temporary directory
deleteDirectory($tempDir);
error_log("Temporary directory deleted");
error_log("Script completed successfully");

// Function to recursively delete a directory
function deleteDirectory($dir)
{
  if (!file_exists($dir)) return;

  $files = array_diff(scandir($dir), ['.', '..']);
  foreach ($files as $file) {
    $path = $dir . '/' . $file;
    if (is_dir($path)) {
      deleteDirectory($path);
    } else {
      unlink($path);
      error_log("Deleted file: " . $path);
    }
  }

  rmdir($dir);
  error_log("Deleted directory: " . $dir);
  return true;
}
