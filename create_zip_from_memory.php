<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  // Only allow POST requests
  http_response_code(405); // Method Not Allowed
  exit('Method not allowed');
}

// Get the post data
$htmlContent = isset($_POST['html_content']) ? $_POST['html_content'] : null;
$docTitle = isset($_POST['doc_title']) ? $_POST['doc_title'] : 'document';
$imageData = isset($_POST['image_data']) ? $_POST['image_data'] : '{}';

if (!$htmlContent) {
  http_response_code(400); // Bad Request
  exit('Missing HTML content');
}

// Generate sanitized folder name for the ZIP structure
$sanitizedTitle = strtolower(preg_replace('/[^a-z0-9\s-]/', '', $docTitle));
$sanitizedTitle = preg_replace('/\s+/', '-', $sanitizedTitle); // Replace spaces with hyphens
$sanitizedTitle = preg_replace('/-+/', '-', $sanitizedTitle); // Avoid multiple hyphens
$sanitizedTitle = trim($sanitizedTitle);
$folderName = $sanitizedTitle ?: 'document';

// Create a temporary directory for the ZIP content
$tempDir = sys_get_temp_dir() . '/' . uniqid('gdoc_');
if (!mkdir($tempDir, 0755, true)) {
  http_response_code(500);
  exit('Failed to create temporary directory');
}

// Create images directory
if (!mkdir($tempDir . '/images', 0755, true)) {
  http_response_code(500);
  exit('Failed to create images directory');
}

// Save the HTML file
file_put_contents($tempDir . '/index.html', $htmlContent);

// Copy the CSS file from the template
$cssTemplate = __DIR__ . '/template/styles.css';
if (file_exists($cssTemplate)) {
  copy($cssTemplate, $tempDir . '/styles.css');
}

// Process and save images from the image data
$imageData = json_decode($imageData, true);
if (is_array($imageData)) {
  foreach ($imageData as $id => $image) {
    if (isset($image['type']) && $image['type'] === 'image' && isset($image['base64'])) {
      $base64String = $image['base64'];

      // Extract the file type from the base64 string
      $matches = [];
      preg_match('/data:image\/([a-zA-Z0-9]+);base64,/', $base64String, $matches);
      $extension = isset($matches[1]) ? $matches[1] : 'png';

      // Remove the base64 header
      $base64String = preg_replace('/data:image\/[a-zA-Z0-9]+;base64,/', '', $base64String);

      // Save the image
      $imageData = base64_decode($base64String);
      file_put_contents($tempDir . '/images/' . $id . '.' . $extension, $imageData);
    }
  }
}

// Create the ZIP file
$zipFile = $tempDir . '.zip';
$zip = new ZipArchive();
if ($zip->open($zipFile, ZipArchive::CREATE) !== true) {
  http_response_code(500);
  exit('Failed to create ZIP file');
}

// Add files to the ZIP
$files = new RecursiveIteratorIterator(
  new RecursiveDirectoryIterator($tempDir),
  RecursiveIteratorIterator::LEAVES_ONLY
);

foreach ($files as $file) {
  // Skip directories (they get added automatically)
  if (!$file->isDir()) {
    $filePath = $file->getRealPath();
    $relativePath = substr($filePath, strlen($tempDir) + 1);

    $zip->addFile($filePath, $relativePath);
  }
}

$zip->close();

// Set headers for file download
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $folderName . '.zip"');
header('Content-Length: ' . filesize($zipFile));
header('Pragma: no-cache');
header('Expires: 0');

// Output the ZIP file
readfile($zipFile);

// Clean up
unlink($zipFile);
deleteDirectory($tempDir);

// Function to recursively delete a directory
function deleteDirectory($dir)
{
  if (!file_exists($dir)) return;

  $files = array_diff(scandir($dir), ['.', '..']);
  foreach ($files as $file) {
    $path = $dir . '/' . $file;
    is_dir($path) ? deleteDirectory($path) : unlink($path);
  }

  return rmdir($dir);
}
