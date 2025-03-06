<?php
header('Content-Type: application/json');

// Détecter l'URL de base
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);

// Construire l'URL de base
$baseUrl = $protocol . "://" . $host . $scriptDir;

echo json_encode([
  'success' => true,
  'baseUrl' => $baseUrl
]);
