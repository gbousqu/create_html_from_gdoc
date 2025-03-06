<?php
header('Content-Type: application/json');

// Récupérer les données de la requête
$data = json_decode(file_get_contents('php://input'), true);

// Vérifier les paramètres requis
if (!isset($data['filename']) || !isset($data['base64data'])) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Paramètres manquants (filename ou base64data)']);
  exit;
}

$filename = $data['filename'];
$base64data = $data['base64data'];

// Extraire la partie de données après le préfixe "data:image/xxx;base64,"
$base64Image = explode(',', $base64data);
if (count($base64Image) < 2) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Format de données base64 invalide']);
  exit;
}

$imageData = base64_decode($base64Image[1]);
if (!$imageData) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Impossible de décoder les données base64']);
  exit;
}

// Chemin complet du fichier de sortie
$outputDir = __DIR__ . '/output';
$fullPath = $outputDir . '/' . $filename;

// Vérifier si le dossier contenant l'image existe, sinon le créer
$directory = dirname($fullPath);
if (!file_exists($directory)) {
  if (!mkdir($directory, 0755, true)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Impossible de créer le dossier pour l'image: $directory"]);
    exit;
  }
}

// Sauvegarder l'image
if (file_put_contents($fullPath, $imageData) === false) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => "Erreur lors de la sauvegarde de l'image: $fullPath"]);
  exit;
}

// Renvoyer le chemin relatif pour l'accès web
$relativePath = 'output/' . $filename;

echo json_encode([
  'success' => true,
  'path' => $relativePath,
  'fullPath' => $fullPath
]);
