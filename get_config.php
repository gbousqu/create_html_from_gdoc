<?php
// Define path to credentials file
$configFile = __DIR__ . '/assets/credentials.json';

// Check if the config file exists
if (file_exists($configFile)) {
  try {
    $content = file_get_contents($configFile);
    $config = json_decode($content, true);

    if ($config === null) {
      echo json_encode(['success' => false, 'message' => 'Failed to parse config file.']);
    } else {
      echo json_encode(['success' => true, 'client_id' => $config['client_id'], 'api_key' => $config['api_key'], 'admin_password' => $config['admin_password']]);
    }
  } catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
  }
} else {
  echo json_encode(['success' => false, 'message' => 'Config file does not exist.']);
}
