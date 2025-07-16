<?php
header('Content-Type: application/json');

// Simulate authentication (in production, check session/token)

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
    case 'get_report':
        // Simulate fetching report data from DB
        $reportType = $input['reportType'] ?? 'overview';
        $dateRange = $input['dateRange'] ?? '30';
        $startDate = $input['startDate'] ?? '';
        $endDate = $input['endDate'] ?? '';
        // Dummy data
        $data = [
            'totalRevenue' => '$45,230',
            'totalSales' => '1,247',
            'totalCustomers' => '89',
            'avgOrderValue' => '23.4%',
            'tableRows' => [
                ['Jan 15, 2024', 'Laptop Pro', 2, '$1,999.98', '$399.98', 'Completed'],
                ['Jan 14, 2024', 'Smartphone X', 1, '$599.99', '$119.99', 'Completed'],
                ['Jan 13, 2024', 'Headphones', 3, '$599.97', '$119.97', 'Pending'],
                ['Jan 12, 2024', 'Tablet', 1, '$399.99', '$79.99', 'Completed'],
            ],
            'topCustomers' => [
                ['name' => 'John Doe', 'spent' => '$2,450'],
                ['name' => 'Jane Smith', 'spent' => '$1,890'],
                ['name' => 'Mike Johnson', 'spent' => '$1,650'],
            ],
            'lowStock' => [
                ['name' => 'Laptop Pro', 'left' => 3],
                ['name' => 'Smartphone X', 'left' => 5],
            ]
        ];
        echo json_encode(['success' => true, 'data' => $data]);
        break;
    case 'email_report':
        // Simulate sending email
        $email = $input['email'] ?? '';
        // In production, generate report, attach, and send email
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => true, 'message' => 'Email sent to ' . $email]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
        }
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
        break;
}
?>