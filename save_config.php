<?php
// Define path to credentials file
$configFile = __DIR__ . '/assets/credentials.json';

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // Get the submitted data
  $clientId = isset($_POST['client_id']) ? $_POST['client_id'] : '';
  $apiKey = isset($_POST['api_key']) ? $_POST['api_key'] : '';

  // Check if client ID and API key are provided
  if (empty($clientId) || empty($apiKey)) {
    echo json_encode(['success' => false, 'message' => 'Client ID and API key are required.']);
    exit;
  }

  // Create config array
  $config = [
    'client_id' => $clientId,
    'api_key' => $apiKey
  ];

  // Add password if provided
  if (isset($_POST['admin_password']) && !empty($_POST['admin_password'])) {
    $config['admin_password'] = $_POST['admin_password'];
  } else {
    // Keep existing password if there is one
    $existingConfig = getExistingConfig();
    if (isset($existingConfig['admin_password'])) {
      $config['admin_password'] = $existingConfig['admin_password'];
    } else {
      $config['admin_password'] = 'admin'; // Default password
    }
  }

  // Save the config to file
  try {
    // Ensure the directory exists
    $dir = dirname($configFile);
    if (!is_dir($dir)) {
      mkdir($dir, 0755, true);
    }

    // Save the config to file
    $result = file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));

    if ($result === false) {
      echo json_encode(['success' => false, 'message' => 'Failed to save configuration.']);
    } else {
      echo json_encode(['success' => true]);
    }
  } catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
  }
} else {
  echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}

// Function to get existing config
function getExistingConfig()
{
  global $configFile;
  if (file_exists($configFile)) {
    $content = file_get_contents($configFile);
    return json_decode($content, true) ?: [];
  }
  return [];
}
