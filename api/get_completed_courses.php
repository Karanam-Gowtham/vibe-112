<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email']) || empty(trim($input['email']))) {
    echo json_encode([
        "success" => false,
        "message" => "User email is required"
    ]);
    exit;
}

$email = trim($input['email']);

// Fetch completed courses (score > 80)
// Using MAX(score) to handle multiple attempts - if any attempt is > 80, it's completed
$sql = "SELECT course, MAX(score) as best_score FROM quiz_results WHERE email = ? GROUP BY course HAVING best_score > 80";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$completed_courses = [];
while ($row = $result->fetch_assoc()) {
    $completed_courses[] = [
        'course_name' => $row['course'],
        'score' => $row['best_score']
    ];
}

echo json_encode([
    "success" => true,
    "data" => $completed_courses
]);

$stmt->close();
$conn->close();
?>
