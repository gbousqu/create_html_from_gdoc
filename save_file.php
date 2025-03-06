<?php
header('Content-Type: application/json');

// Récupérer les données de la requête
$data = json_decode(file_get_contents('php://input'), true);

// Vérifier les paramètres requis
if (!isset($data['filename']) || !isset($data['content'])) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Paramètres manquants (filename ou content)']);
  exit;
}

$filename = $data['filename'];
$content = $data['content'];

// Chemin complet du fichier de sortie
$outputDir = __DIR__ . '/output';
$fullPath = $outputDir . '/' . $filename;

// Vérifier si le dossier contenant le fichier existe, sinon le créer
$directory = dirname($fullPath);
if (!file_exists($directory)) {
  if (!mkdir($directory, 0755, true)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Impossible de créer le dossier pour le fichier: $directory"]);
    exit;
  }
}

// Sauvegarder le fichier
if (file_put_contents($fullPath, $content) === false) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => "Erreur lors de la sauvegarde du fichier: $fullPath"]);
  exit;
}

// Renvoyer le chemin relatif pour l'accès web
$relativePath = 'output/' . $filename;

echo json_encode([
  'success' => true,
  'path' => $relativePath,
  'fullPath' => $fullPath
]);
