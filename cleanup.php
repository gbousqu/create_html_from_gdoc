<?php
// This script should be called via cron job to clean up old generated sites
// Example cron entry: 0 0 * * * php /path/to/create_html_from_gdoc/cleanup.php

// Load configuration
$config = include 'config.php';

// Skip if server storage is disabled
if (!$config['server_storage']['enabled']) {
  exit('Server storage is disabled, nothing to clean up.');
}

$maxAgeDays = $config['server_storage']['limits']['max_age_days'] ?? 30;
$maxAgeSeconds = $maxAgeDays * 86400; // Convert days to seconds
$outputDir = __DIR__ . '/output';
$sitesRemoved = 0;
$totalSize = 0;

// Ensure the output directory exists
if (!is_dir($outputDir)) {
  exit("Output directory not found: {$outputDir}");
}

// Get all site directories
$dirs = glob($outputDir . '/*', GLOB_ONLYDIR);

foreach ($dirs as $dir) {
  // Get the last modification time of the directory
  $lastModified = filemtime($dir);

  // If it's older than the allowed age, delete it
  if (time() - $lastModified > $maxAgeSeconds) {
    // Get the directory size before deletion for reporting
    $size = dirSize($dir);
    $totalSize += $size;

    // Delete the directory and all its contents
    if (deleteDirectory($dir)) {
      $sitesRemoved++;
      echo "Removed site: " . basename($dir) . " (Size: " . formatBytes($size) . ")\n";
    } else {
      echo "Failed to remove site: " . basename($dir) . "\n";
    }
  }
}

echo "Cleanup completed. Removed {$sitesRemoved} sites. Total space freed: " . formatBytes($totalSize) . "\n";

// Function to recursively delete a directory
function deleteDirectory($dir)
{
  if (!file_exists($dir)) return true;

  $files = array_diff(scandir($dir), ['.', '..']);
  foreach ($files as $file) {
    $path = $dir . '/' . $file;
    is_dir($path) ? deleteDirectory($path) : unlink($path);
  }

  return rmdir($dir);
}

// Function to get directory size
function dirSize($dir)
{
  $size = 0;

  foreach (glob(rtrim($dir, '/') . '/*', GLOB_NOSORT) as $each) {
    $size += is_file($each) ? filesize($each) : dirSize($each);
  }

  return $size;
}

// Function to format bytes to human-readable format
function formatBytes($bytes, $precision = 2)
{
  $units = ['B', 'KB', 'MB', 'GB', 'TB'];

  $bytes = max($bytes, 0);
  $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
  $pow = min($pow, count($units) - 1);

  $bytes /= (1 << (10 * $pow));

  return round($bytes, $precision) . ' ' . $units[$pow];
}
