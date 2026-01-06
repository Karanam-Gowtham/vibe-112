<?php
$root = __DIR__;
include $root . '/includes/db_connect.php';

echo "<h1>Database Debug Check</h1>";

// Check Users
$sql = "SELECT id, email, streak, last_active_date FROM users";
$result = $conn->query($sql);

echo "<h2>Users (" . $result->num_rows . ")</h2>";
echo "<table border='1'><tr><th>ID</th><th>Email</th><th>Streak</th><th>Last Active</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr><td>{$row['id']}</td><td>{$row['email']}</td><td>{$row['streak']}</td><td>{$row['last_active_date']}</td></tr>";
}
echo "</table>";

// Check Courses
$sql = "SELECT id, course_name, email FROM courses";
$result = $conn->query($sql);

echo "<h2>Courses (" . $result->num_rows . ")</h2>";
echo "<table border='1'><tr><th>ID</th><th>Course</th><th>Email</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr><td>{$row['id']}</td><td>{$row['course_name']}</td><td>{$row['email']}</td></tr>";
}
echo "</table>";

// Check Quiz Results
$sql = "SELECT id, course, score, email FROM quiz_results";
$result = $conn->query($sql);

echo "<h2>Quiz Results (" . $result->num_rows . ")</h2>";
echo "<table border='1'><tr><th>ID</th><th>Course</th><th>Score</th><th>Email</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr><td>{$row['id']}</td><td>{$row['course']}</td><td>{$row['score']}</td><td>{$row['email']}</td></tr>";
}
echo "</table>";

$conn->close();
?>
