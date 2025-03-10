<?php
header('Content-Type: application/json');

// Load the application configuration
$config = include 'config.php';

// Check if the full configuration is requested (admin only)
$fullConfig = isset($_GET['full']) && $_GET['full'] === '1';

if ($fullConfig) {
  // For admin, return the complete configuration
  echo json_encode($config);
} else {
  // For normal users, return only the needed configuration data
  echo json_encode([
    'server_storage' => [
      'enabled' => $config['server_storage']['enabled']
    ]
  ]);
}
