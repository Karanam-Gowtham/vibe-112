<?php
include 'includes/db_connect.php';

echo "--- EXACT EMAILS IN USERS TABLE ---\n";
$users = $conn->query("SELECT id, email, LENGTH(email) as len FROM users");
while($row = $users->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | LEN: " . $row['len'] . " | EMAIL: " . $row['email'] . "\n";
}

echo "\n--- EXACT EMAILS IN QUIZ RESULTS TABLE ---\n";
$results = $conn->query("SELECT id, email, LENGTH(email) as len, course FROM quiz_results");
while($row = $results->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | LEN: " . $row['len'] . " | EMAIL: " . $row['email'] . "\n";
}

$conn->close();
?>
