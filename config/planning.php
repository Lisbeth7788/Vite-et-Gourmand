<?php

const WEEKLY_LIMIT_MINUTES = 35 * 60;
const MAX_DAYS_PER_WEEK = 5;
const MIN_REST_SECONDS = 11 * 3600;

function minutesBetween(string $start, string $end): int
{
    return (int) ((strtotime("2000-01-01 $end") - strtotime("2000-01-01 $start")) / 60);
}

// Planning type : chaque poste est couvert à midi et le soir, avec 35 h, 5 jours et 11 h de repos maximum par personne.
function generateWeek(PDO $pdo, string $date): array
{
    $monday = (new DateTimeImmutable($date))->modify('monday this week');
    $weekNumber = (int) $monday->format('W');
    $dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    $slots = [
        ['role' => 'cuisine', 'label' => 'Midi', 'parts' => [['09:00', '16:00']]],
        ['role' => 'cuisine', 'label' => 'Soir', 'parts' => [['15:00', '22:00']]],
        ['role' => 'serveur', 'label' => 'Service complet', 'parts' => [['11:00', '14:30'], ['18:00', '21:30']]],
        ['role' => 'plongeur', 'label' => 'Service complet', 'parts' => [['11:00', '14:30'], ['18:00', '21:30']]]
    ];
    $kitchenJobs = ['chef', 'sous-chef', 'commis'];
    $ownerParts = [['11:00', '14:30'], ['18:00', '21:30']];

    $people = $pdo->query("SELECT id, first_name, job_title FROM users WHERE role = 'employe' AND is_active = 1 ORDER BY created_at, id")->fetchAll();
    $state = [];
    foreach ($people as $person) {
        $state[$person['id']] = ['minutes' => 0, 'days' => 0, 'lastEnd' => 0, 'today' => -1];
    }

    $end = $monday->modify('+6 days')->format('Y-m-d');
    $pdo->beginTransaction();
    $delete = $pdo->prepare('DELETE FROM employee_shifts WHERE user_id = ? AND shift_date BETWEEN ? AND ?');
    foreach ($people as $person) {
        $delete->execute([$person['id'], $monday->format('Y-m-d'), $end]);
    }
    $insert = $pdo->prepare('INSERT INTO employee_shifts (user_id, shift_date, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)');

    $warnings = [];
    for ($day = 0; $day < 7; $day++) {
        $dayDate = $monday->modify("+$day days")->format('Y-m-d');
        foreach ($slots as $slot) {
            $minutes = 0;
            foreach ($slot['parts'] as [$from, $to]) {
                $minutes += minutesBetween($from, $to);
            }
            $firstStart = strtotime("$dayDate {$slot['parts'][0][0]}");
            $pool = array_values(array_filter($people, fn ($p) => $slot['role'] === 'cuisine' ? in_array($p['job_title'], $kitchenJobs, true) : $p['job_title'] === $slot['role']));
            $eligible = [];
            foreach ($pool as $index => $person) {
                $s = $state[$person['id']];
                if ($s['today'] === $day || $s['days'] >= MAX_DAYS_PER_WEEK || $s['minutes'] + $minutes > WEEKLY_LIMIT_MINUTES || $firstStart - $s['lastEnd'] < MIN_REST_SECONDS) {
                    continue;
                }
                $eligible[] = ['person' => $person, 'minutes' => $s['minutes'], 'rotation' => ($index + $weekNumber + $day) % max(1, count($pool))];
            }
            if (!$eligible) {
                $warnings[] = $dayNames[$day] . ' ' . $monday->modify("+$day days")->format('d/m') . ' – ' . $slot['role'] . ' (' . $slot['label'] . ') à pourvoir';
                continue;
            }
            usort($eligible, fn ($a, $b) => [$a['minutes'], $a['rotation']] <=> [$b['minutes'], $b['rotation']]);
            $chosen = $eligible[0]['person'];
            foreach ($slot['parts'] as [$from, $to]) {
                $insert->execute([$chosen['id'], $dayDate, $from, $to, $slot['label']]);
            }
            $state[$chosen['id']]['minutes'] += $minutes;
            $state[$chosen['id']]['days']++;
            $state[$chosen['id']]['today'] = $day;
            $state[$chosen['id']]['lastEnd'] = strtotime("$dayDate " . end($slot['parts'])[1]);
        }
        // Les propriétaires sont présents à chaque service, tous les jours.
        foreach ($people as $person) {
            if ($person['job_title'] === 'patron') {
                foreach ($ownerParts as [$from, $to]) {
                    $insert->execute([$person['id'], $dayDate, $from, $to, 'Présent au service']);
                }
            }
        }
    }
    $pdo->commit();
    return ['monday' => $monday->format('Y-m-d'), 'warnings' => array_values(array_unique($warnings)), 'people' => count($people)];
}
