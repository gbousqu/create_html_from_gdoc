<?php
header('Content-Type: application/json');

// Récupérer les données de la requête
$data = json_decode(file_get_contents('php://input'), true);
$mainFolder = isset($data['mainFolder']) ? $data['mainFolder'] : '';

// Vérifier et créer le dossier de sortie principal s'il n'existe pas
$outputDir = __DIR__ . '/output';
if (!file_exists($outputDir)) {
  if (!mkdir($outputDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Impossible de créer le dossier output"]);
    exit;
  }
}

// Si un nom de dossier principal est spécifié
if (!empty($mainFolder)) {
  $docDir = $outputDir . '/' . $mainFolder;
  $folderExists = file_exists($docDir);

  // Créer le dossier spécifique au document s'il n'existe pas
  if (!$folderExists) {
    if (!mkdir($docDir, 0755, true)) {
      http_response_code(500);
      echo json_encode(['success' => false, 'message' => "Impossible de créer le dossier $mainFolder"]);
      exit;
    }
  }

  // Créer le sous-dossier images dans le dossier du document (toujours vérifier, même si le dossier principal existe)
  $imagesDir = $docDir . '/images';
  if (!file_exists($imagesDir)) {
    if (!mkdir($imagesDir, 0755, true)) {
      http_response_code(500);
      echo json_encode(['success' => false, 'message' => "Impossible de créer le dossier images dans $mainFolder"]);
      exit;
    }
  }

  // Copier le fichier styles.css (toujours essayer, même si le dossier principal existe)
  $sourceStylesPath = __DIR__ . '/styles.css';
  $targetStylesPath = $docDir . '/styles.css';

  if (file_exists($sourceStylesPath)) {
    $copyResult = copy($sourceStylesPath, $targetStylesPath);
    if (!$copyResult) {
      error_log("Échec de la copie du fichier styles.css vers $targetStylesPath");
    }
  } else {
    // Si le fichier source n'existe pas à cet emplacement, essayer de le trouver dans /output
    $alternativeSourcePath = $outputDir . '/styles.css';
    if (file_exists($alternativeSourcePath)) {
      $copyResult = copy($alternativeSourcePath, $targetStylesPath);
      if (!$copyResult) {
        error_log("Échec de la copie du fichier styles.css (depuis output) vers $targetStylesPath");
      }
    } else {
      error_log("Le fichier styles.css est introuvable");
    }
  }

  echo json_encode([
    'success' => true,
    'folder' => $mainFolder,
    'exists' => $folderExists,
    'path' => $docDir,
    'stylesCopied' => isset($copyResult) ? $copyResult : false
  ]);
} else {
  // Comportement par défaut (rétrocompatibilité)
  $imagesDir = $outputDir . '/images';
  if (!file_exists($imagesDir)) {
    if (!mkdir($imagesDir, 0755, true)) {
      http_response_code(500);
      echo json_encode(['success' => false, 'message' => "Impossible de créer le dossier images"]);
      exit;
    }
  }

  echo json_encode(['success' => true]);
}
