<?php
include 'includes/db_connect.php';

echo "--- JOINED DATA (QUIS RESULTS + USERS) ---\n";
$sql = "SELECT q.id as quiz_id, q.email as quiz_email, u.email as user_email, q.course, q.score 
        FROM quiz_results q 
        LEFT JOIN users u ON q.email = u.email";
$res = $conn->query($sql);
while($row = $res->fetch_assoc()) {
    echo "Quiz ID: " . $row['quiz_id'] . " | Quiz Email: " . $row['quiz_email'] . " | User Match: " . ($row['user_email'] ? "YES" : "NO") . " | Course: " . $row['course'] . "\n";
}
$conn->close();
?>
