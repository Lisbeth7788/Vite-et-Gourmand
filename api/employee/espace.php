<?php

require_once __DIR__ . '/../../config/database.php';
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

if ($method === 'POST') {
    $data = requestData();
    $content = trim((string) ($data['content'] ?? ''));
    if ($content === '' || mb_strlen($content) > 2000) {
        jsonResponse(['error' => 'Le compte rendu est obligatoire (2000 caractères maximum).'], 400);
    }
    $insert = $pdo->prepare('INSERT INTO employee_reports (user_id, report_date, content) VALUES (?, CURDATE(), ?)');
    $insert->execute([$user['id'], $content]);
    jsonResponse(['message' => 'Compte rendu enregistré.'], 201);
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

$reports = $pdo->prepare('SELECT report_date, content FROM employee_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
$reports->execute([$targetId]);

$payslips = $pdo->prepare('SELECT period, hours, gross, net, note FROM payslips WHERE user_id = ? ORDER BY period DESC LIMIT 24');
$payslips->execute([$targetId]);

$weekStart = new DateTimeImmutable(preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($_GET['week'] ?? '')) ? $_GET['week'] : 'today');
$weekStart = $weekStart->modify('monday this week');
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
    'tasks' => $tasks->fetchAll(),
    'reports' => $reports->fetchAll(),
    'payslips' => $payslips->fetchAll()
]);
