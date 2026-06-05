<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$apiKey = '2298244F7BDCC2F8753BF0CC969D2FEB';
$steamId = '76561199649574251';

if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Steam API key tanimli degil.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$endpoint = sprintf(
    'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=%s&steamids=%s',
    rawurlencode($apiKey),
    rawurlencode($steamId)
);

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 5,
        'ignore_errors' => true,
        'header' => "Accept: application/json\r\nUser-Agent: berayefe.com/steam-widget\r\n",
    ],
]);

$result = @file_get_contents($endpoint, false, $context);

if ($result === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Steam API yanit vermedi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($result, true);
$player = $data['response']['players'][0] ?? null;
$personaName = is_array($player) ? ($player['personaname'] ?? null) : null;

if (!is_string($personaName) || trim($personaName) === '') {
    http_response_code(404);
    echo json_encode(['error' => 'Steam kullanicisi bulunamadi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(
    [
        'personaname' => trim($personaName),
        'profileurl' => $player['profileurl'] ?? 'https://steamcommunity.com/profiles/' . $steamId,
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
