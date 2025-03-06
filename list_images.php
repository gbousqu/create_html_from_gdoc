<?php
header('Content-Type: application/json');

// Récupérer les données de la requête (nom du dossier)
$data = json_decode(file_get_contents('php://input'), true);
$folderName = isset($data['folderName']) ? $data['folderName'] : '';

// Définir le chemin vers le dossier d'images
$outputDir = __DIR__ . '/output/';

// Si un dossier spécifique est demandé, utiliser ce sous-dossier
if (!empty($folderName)) {
  $imagesDir = $outputDir . $folderName . '/images/';
} else {
  // Comportement par défaut (rétrocompatibilité)
  $imagesDir = $outputDir . 'images/';
}

$existingImages = [];

// Vérifier si le dossier existe
if (is_dir($imagesDir)) {
  // Lister tous les fichiers d'image
  $files = glob($imagesDir . '*.*');

  // Extraire les ID d'objet à partir des noms de fichiers
  foreach ($files as $file) {
    $filename = basename($file);
    // Format attendu: {objectId}.{extension}
    if (preg_match('/^(.+)\.([a-zA-Z0-9]+)$/', $filename, $matches)) {
      $objectId = $matches[1];
      $extension = $matches[2];

      // Le chemin retourné doit être relatif au dossier spécifique
      $relativePath = !empty($folderName) ?
        $folderName . '/images/' . $filename :
        'images/' . $filename;

      $existingImages[$objectId] = [
        'path' => $relativePath,
        'extension' => $extension,
        'filesize' => filesize($file)
      ];
    }
  }
}

echo json_encode([
  'success' => true,
  'images' => $existingImages
]);
