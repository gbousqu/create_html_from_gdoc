<?php

ini_set('log_errors', 1);
ini_set('error_log', 'error.log'); // Remplacez par le chemin réel de votre fichier de log


$url = $_GET['url'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
if (is_local()) {
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Désactiver la vérification du certificat SSL
  curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Désactiver la vérification de l'hôte SSL
}

curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
]);
$response = curl_exec($ch);

if ($response === false) {
  $error = curl_error($ch);
  error_log($error);
  curl_close($ch);
  http_response_code(500);
  exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $header_size);
$body = substr($response, $header_size);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode == 200) {
  header("Content-Type: $contentType");
  echo $body;
} else {
  http_response_code($httpCode);
  echo "Error fetching the image.";
}


function is_local()
{
  // Liste des adresses IP locales
  $local_ips = ['127.0.0.1', '::1'];

  // Vérifiez si l'adresse IP actuelle est dans la liste des adresses IP locales
  if (in_array($_SERVER['REMOTE_ADDR'], $local_ips)) {
    return true;
  } else {
    return false;
  }
}
