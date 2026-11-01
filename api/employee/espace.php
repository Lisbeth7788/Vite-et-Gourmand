<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/planning.php';
$user = requireRole(['employe', 'admin']);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['task_id']) || !isset($data['done'])) {
        jsonResponse(['error' => 'Tâche invalide.'], 400);
    }
    $update = $pdo->prepare('UPDATE employee_tasks SET is_done = ? WHERE id = ? AND user_id = ?');
    $update->execute([filter_var($data['done'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0, (int) $data['task_id'], $user['id']]);
    jsonResponse(['message' => 'Tâche mise à jour.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

// L'administrateur peut consulter l'espace d'un employé précis.
$targetId = $user['id'];
if ($user['role'] === 'admin' && !empty($_GET['user_id'])) {
    $targetId = (string) $_GET['user_id'];
}

$profile = $pdo->prepare('SELECT first_name, last_name, job_title FROM users WHERE id = ?');
$profile->execute([$targetId]);

$shifts = $pdo->prepare(
    'SELECT shift_date, SUBSTRING(start_time, 1, 5) AS start_time, SUBSTRING(end_time, 1, 5) AS end_time, note
     FROM employee_shifts WHERE user_id = ? AND shift_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     ORDER BY shift_date, start_time'
);
$shifts->execute([$targetId]);

$tasks = $pdo->prepare(
    'SELECT id, task_date, title, is_done FROM employee_tasks
     WHERE user_id = ? AND task_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     ORDER BY task_date, id'
);
$tasks->execute([$targetId]);

$weekStart = new DateTimeImmutable(preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($_GET['week'] ?? '')) ? $_GET['week'] : 'today');
$weekStart = $weekStart->modify('monday this week');

// Le planning de la semaine est créé automatiquement s'il n'existe pas encore.
$count = $pdo->prepare("SELECT COUNT(*) FROM employee_shifts s JOIN users u ON u.id = s.user_id WHERE u.role = 'employe' AND u.is_active = 1 AND s.shift_date BETWEEN ? AND ?");
$count->execute([$weekStart->format('Y-m-d'), $weekStart->modify('+6 days')->format('Y-m-d')]);
if ((int) $count->fetchColumn() === 0) {
    generateWeek($pdo, $weekStart->format('Y-m-d'));
}

$team = $pdo->prepare(
    "SELECT u.id AS user_id, u.first_name, u.job_title, s.shift_date, SUBSTRING(s.start_time, 1, 5) AS start_time, SUBSTRING(s.end_time, 1, 5) AS end_time
     FROM users u LEFT JOIN employee_shifts s ON s.user_id = u.id AND s.shift_date BETWEEN ? AND ?
     WHERE u.role = 'employe' AND u.is_active = 1 ORDER BY u.job_title, u.first_name, s.shift_date, s.start_time"
);
$team->execute([$weekStart->format('Y-m-d'), $weekStart->modify('+6 days')->format('Y-m-d')]);

jsonResponse([
    'profile' => $profile->fetch(),
    'today' => date('Y-m-d'),
    'me' => $targetId,
    'weekStart' => $weekStart->format('Y-m-d'),
    'team' => $team->fetchAll(),
    'shifts' => $shifts->fetchAll(),
    'tasks' => $tasks->fetchAll()
]);
