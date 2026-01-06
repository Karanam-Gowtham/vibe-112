<?php
$_POST = json_decode('{"email":"gowtham.prakash00007@gmail.com"}', true);
// We can't easily mock php://input without more work, but we can call the logic.

// Let's just run the DB query logic here.
include 'includes/db_connect.php';
$email = "gowtham.prakash00007@gmail.com";
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

echo json_encode(["success" => true, "data" => $progress_data]);
$conn->close();
?>
