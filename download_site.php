<?php
// Get the folder name from the URL parameter
$folder = isset($_GET['folder']) ? $_GET['folder'] : '';

// Sanitize the folder name to avoid directory traversal
$folder = preg_replace('/[^a-zA-Z0-9_-]/', '', $folder);

if (empty($folder)) {
  die('Error: No folder specified.');
}

// Path to the output directory
$outputDir = __DIR__ . '/output/' . $folder;

// Check if the directory exists
if (!is_dir($outputDir)) {
  die('Error: The specified folder does not exist.');
}

// Define the name of the ZIP file
$zipFileName = 'site_' . $folder . '.zip';
$zipFilePath = __DIR__ . '/tmp/' . $zipFileName;

// Create tmp directory if it doesn't exist
if (!is_dir(__DIR__ . '/tmp')) {
  mkdir(__DIR__ . '/tmp', 0755, true);
}

// Create a new ZIP archive
$zip = new ZipArchive();

if ($zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
  die('Error: Could not create ZIP archive.');
}

// Add files to the ZIP archive, preserving directory structure
$files = new RecursiveIteratorIterator(
  new RecursiveDirectoryIterator($outputDir),
  RecursiveIteratorIterator::LEAVES_ONLY
);

foreach ($files as $name => $file) {
  // Skip directories (they are added automatically)
  if (!$file->isDir()) {
    // Get real and relative path for current file
    $filePath = $file->getRealPath();

    // Calculate the relative path - preserve the full directory structure
    $relativePath = substr($filePath, strlen($outputDir) + 1);

    // Add current file to archive with its directory structure preserved
    $zip->addFile($filePath, $relativePath);
  }
}

// Close the ZIP file
$zip->close();

// Set headers for download
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $zipFileName . '"');
header('Content-Length: ' . filesize($zipFilePath));
header('Pragma: no-cache');

// Output the ZIP file
readfile($zipFilePath);

// Delete the temporary ZIP file
unlink($zipFilePath);
exit;
