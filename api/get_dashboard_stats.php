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

// Get enrolled courses count
$sql = "SELECT COUNT(*) as count FROM courses WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$enrolled_count = $row['count'];

// Get current streak stats
$user_sql = "SELECT id, streak, last_active_date FROM users WHERE email = ?";
$user_stmt = $conn->prepare($user_sql);
$user_stmt->bind_param("s", $email);
$user_stmt->execute();
$user_result = $user_stmt->get_result();
$user_data = $user_result->fetch_assoc();

$streak = 0;
$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

if ($user_data) {
    $streak = $user_data['streak'];
    $last_active = $user_data['last_active_date'];

    if ($last_active === $today) {
        // Already active today, streak stays same
    } elseif ($last_active === $yesterday) {
        // Continued streak
        $streak++;
        // Update DB
        $update_sql = "UPDATE users SET streak = ?, last_active_date = ? WHERE email = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bind_param("iss", $streak, $today, $email);
        $update_stmt->execute();
        $update_stmt->close();
    } else {
        // Broken streak or first time
        $streak = 1;
        // Update DB
        $update_sql = "UPDATE users SET streak = ?, last_active_date = ? WHERE email = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bind_param("iss", $streak, $today, $email);
        $update_stmt->execute();
        $update_stmt->close();
    }
}

$user_stmt->close();

// Get attempted quizzes count
$quiz_sql = "SELECT COUNT(*) as count FROM quiz_results WHERE email = ?";
$quiz_stmt = $conn->prepare($quiz_sql);
$quiz_stmt->bind_param("s", $email);
$quiz_stmt->execute();
$quiz_result = $quiz_stmt->get_result();
$quiz_row = $quiz_result->fetch_assoc();
$quizzes_count = $quiz_row['count'];
$quiz_stmt->close();

// Get completed courses count (score > 80)
$completed_sql = "SELECT COUNT(DISTINCT course) as count FROM quiz_results WHERE email = ? AND score > 80";
$completed_stmt = $conn->prepare($completed_sql);
$completed_stmt->bind_param("s", $email);
$completed_stmt->execute();
$completed_result = $completed_stmt->get_result();
$completed_row = $completed_result->fetch_assoc();
$completed_count = $completed_row['count'];
$completed_stmt->close();

echo json_encode([
    "success" => true,
    "stats" => [
        "enrolled" => $enrolled_count,
        "completed" => $completed_count,
        "quizzes" => $quizzes_count,
        "streak" => $streak
    ]
]);

$stmt->close();
$conn->close();
?>
