<?php
// This script handles all configuration updates (API credentials and app settings)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'message' => 'Method not allowed']);
  exit;
}

// Process API credentials
$credentialsFile = __DIR__ . '/assets/credentials.json';
$existingCredentials = [];

// Get existing credentials if available
if (file_exists($credentialsFile)) {
  $existingCredentials = json_decode(file_get_contents($credentialsFile), true) ?: [];
}

// Update credentials if provided
$credentialsUpdated = false;
$newCredentials = $existingCredentials;

// Update API Key
if (isset($_POST['api_key']) && !empty($_POST['api_key'])) {
  $newCredentials['api_key'] = trim($_POST['api_key']);
  $credentialsUpdated = true;
}

// Update Client ID
if (isset($_POST['client_id']) && !empty($_POST['client_id'])) {
  $newCredentials['client_id'] = trim($_POST['client_id']);
  $credentialsUpdated = true;
}

// Update admin password if provided
if (isset($_POST['admin_password']) && !empty($_POST['admin_password'])) {
  $newCredentials['admin_password'] = password_hash(trim($_POST['admin_password']), PASSWORD_DEFAULT);
  $credentialsUpdated = true;
}

// Save updated credentials if changed
if ($credentialsUpdated) {
  // Ensure directory exists
  $credentialsDir = dirname($credentialsFile);
  if (!is_dir($credentialsDir)) {
    if (!mkdir($credentialsDir, 0755, true)) {
      header('Content-Type: application/json');
      echo json_encode(['success' => false, 'message' => 'Failed to create credentials directory']);
      exit;
    }
  }

  // Save credentials
  if (file_put_contents($credentialsFile, json_encode($newCredentials, JSON_PRETTY_PRINT)) === false) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Failed to save credentials']);
    exit;
  }
}

// Process application configuration
$configFile = __DIR__ . '/config.php';

// Load existing configuration
$existingConfig = [];
if (file_exists($configFile)) {
  $existingConfig = include $configFile;
}

// Default configuration if not exists
if (!is_array($existingConfig)) {
  $existingConfig = [
    'server_storage' => [
      'enabled' => false,
      'limits' => [
        'max_sites_per_ip' => 3,
        'max_total_sites' => 50,
        'max_site_size' => 10 * 1024 * 1024, // 10MB
        'max_age_days' => 30
      ]
    ]
  ];
}

// Update server storage settings
$configUpdated = false;

// Update enabled state
if (isset($_POST['server_storage_enabled'])) {
  $newEnabled = filter_var($_POST['server_storage_enabled'], FILTER_VALIDATE_BOOLEAN);
  if (!isset($existingConfig['server_storage'])) {
    $existingConfig['server_storage'] = [];
  }
  $existingConfig['server_storage']['enabled'] = $newEnabled;
  $configUpdated = true;

  // Update limits
  if (!isset($existingConfig['server_storage']['limits'])) {
    $existingConfig['server_storage']['limits'] = [];
  }

  // Max sites per IP
  if (isset($_POST['max_sites_per_ip'])) {
    $maxSitesPerIp = intval($_POST['max_sites_per_ip']);
    if ($maxSitesPerIp > 0) {
      $existingConfig['server_storage']['limits']['max_sites_per_ip'] = $maxSitesPerIp;
    }
  }

  // Max total sites
  if (isset($_POST['max_total_sites'])) {
    $maxTotalSites = intval($_POST['max_total_sites']);
    if ($maxTotalSites > 0) {
      $existingConfig['server_storage']['limits']['max_total_sites'] = $maxTotalSites;
    }
  }

  // Max site size (convert MB to bytes)
  if (isset($_POST['max_site_size'])) {
    $maxSiteSize = intval($_POST['max_site_size']);
    if ($maxSiteSize > 0) {
      $existingConfig['server_storage']['limits']['max_site_size'] = $maxSiteSize * 1024 * 1024;
    }
  }

  // Auto-delete after days
  if (isset($_POST['max_age_days'])) {
    $maxAgeDays = intval($_POST['max_age_days']);
    if ($maxAgeDays > 0) {
      $existingConfig['server_storage']['limits']['max_age_days'] = $maxAgeDays;
    }
  }
}

// Save updated configuration if changed
if ($configUpdated) {
  $configData = "<?php\nreturn " . var_export($existingConfig, true) . ";\n";
  if (file_put_contents($configFile, $configData) === false) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Failed to save application configuration']);
    exit;
  }
}

// Return success
header('Content-Type: application/json');
echo json_encode(['success' => true]);
