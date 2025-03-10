<?php
// This script should be called from the admin page to update the configuration
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'message' => 'Method not allowed']);
  exit;
}

// Load current configuration
$config = include 'config.php';

// Update server storage settings if provided
if (isset($_POST['server_storage_enabled'])) {
  $config['server_storage']['enabled'] = $_POST['server_storage_enabled'] === 'true';

  // Update limits if server storage is enabled
  if ($config['server_storage']['enabled']) {
    // Max sites per IP
    if (isset($_POST['max_sites_per_ip'])) {
      $maxSitesPerIp = intval($_POST['max_sites_per_ip']);
      if ($maxSitesPerIp > 0) {
        $config['server_storage']['limits']['max_sites_per_ip'] = $maxSitesPerIp;
      }
    }

    // Max total sites
    if (isset($_POST['max_total_sites'])) {
      $maxTotalSites = intval($_POST['max_total_sites']);
      if ($maxTotalSites > 0) {
        $config['server_storage']['limits']['max_total_sites'] = $maxTotalSites;
      }
    }

    // Max site size (convert MB to bytes)
    if (isset($_POST['max_site_size'])) {
      $maxSiteSize = intval($_POST['max_site_size']);
      if ($maxSiteSize > 0) {
        $config['server_storage']['limits']['max_site_size'] = $maxSiteSize * 1024 * 1024;
      }
    }

    // Auto-delete after days
    if (isset($_POST['max_age_days'])) {
      $maxAgeDays = intval($_POST['max_age_days']);
      if ($maxAgeDays > 0) {
        $config['server_storage']['limits']['max_age_days'] = $maxAgeDays;
      }
    }
  }
}

// Save the updated configuration
$configContent = "<?php\nreturn " . var_export($config, true) . ";\n?>";
file_put_contents('config.php', $configContent);

header('Content-Type: application/json');
echo json_encode(['success' => true]);
