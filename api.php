<?php
// Secure Backend Proxy
require_once 'config.php';
header('Content-Type: application/json');

// Get JSON payload
$inputData = json_decode(file_get_contents('php://input'), true);
$code = isset($inputData['code']) ? trim($inputData['code']) : '';
$style = isset($inputData['style']) ? trim($inputData['style']) : 'simple';

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'No code snippet provided.']);
    exit;
}

// Prompt Engineering based on selected style
$systemInstruction = "";
if ($style === 'detailed') {
    $systemInstruction = "You are an expert programming tutor. The user will provide a code snippet. Provide a highly detailed, step-by-step breakdown of how the code functions, explaining the logic behind each major line or block.";
} elseif ($style === 'formal') {
    $systemInstruction = "You are a senior software engineer. The user will provide a code snippet. Provide a formal, academic-style analysis of the code, discussing its algorithmic complexity, structure, and purpose in professional terms.";
} else {
    $systemInstruction = "You are a helpful teaching assistant for beginners. The user will provide a code snippet. Explain what this code does in very simple, plain English without using overly technical jargon. Focus on the big picture outcome.";
}

$prompt = $systemInstruction . "\n\nHere is the code:\n```\n" . $code . "\n```";

// Gemini API Endpoint
$apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . GEMINI_API_KEY;

$payload = [
    'contents' => [
        [
            'parts' => [
                ['text' => $prompt]
            ]
        ]
    ]
];

// cURL Request
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server connection error.']);
    curl_close($ch);
    exit;
}
curl_close($ch);

$responseData = json_decode($response, true);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'AI API Error: ' . ($responseData['error']['message'] ?? 'Unknown error')]);
    exit;
}

$generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? null;

if ($generatedText) {
    echo json_encode(['message' => trim($generatedText)]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Could not parse response from AI.']);
}
?>