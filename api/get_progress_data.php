<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

// Fallback to $_POST if json_decode fails
if (!isset($input['email']) || empty(trim($input['email']))) {
    echo json_encode([
        "success" => false,
        "message" => "User email is required"
    ]);
    exit;
}

$email = trim($input['email']);

// Fetch latest 10 quiz results ordered by id ASC to show trend
$sql = "SELECT course, score, created_at FROM quiz_results WHERE email = ? ORDER BY id ASC LIMIT 10";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$progress_data = [];
while ($row = $result->fetch_assoc()) {
    $progress_data[] = [
        'course' => $row['course'],
        'score' => (int)$row['score'],
        'date' => date('M d', strtotime($row['created_at']))
    ];
}

echo json_encode([
    "success" => true,
    "data" => $progress_data
]);

$stmt->close();
$conn->close();
?>
