// Simple API test utility for development
export async function testApiRoutes() {
    const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://your-domain.com'
        : 'http://localhost:3000';

    const tests = [
        {
            name: 'Health Check',
            method: 'GET',
            url: `${baseUrl}/api/mint/health`,
            expectedStatus: 200,
        },
        {
            name: 'Status Check',
            method: 'GET',
            url: `${baseUrl}/api/mint/status`,
            expectedStatus: 200,
        },
        {
            name: 'Allocation Check',
            method: 'GET',
            url: `${baseUrl}/api/mint/allocation`,
            expectedStatus: 200,
        },
        {
            name: 'Allocation Check - Specific Type',
            method: 'GET',
            url: `${baseUrl}/api/mint/allocation?type=public`,
            expectedStatus: 200,
        },
        {
            name: 'Transaction Verification - Invalid Hash',
            method: 'POST',
            url: `${baseUrl}/api/mint/verify`,
            body: { txHash: 'invalid' },
            expectedStatus: 400,
        },
        {
            name: 'Airdrop - Missing Fields',
            method: 'POST',
            url: `${baseUrl}/api/mint/airdrop`,
            body: {},
            expectedStatus: 400,
        },
        {
            name: 'Batch Airdrop - Invalid Recipients',
            method: 'POST',
            url: `${baseUrl}/api/mint/airdrop/batch`,
            body: { recipients: 'invalid' },
            expectedStatus: 400,
        },
    ];

    console.log('🧪 Running API Route Tests...\n');

    for (const test of tests) {
        try {
            const options: RequestInit = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const response = await fetch(test.url, options);
            const data = await response.json();

            const status = response.status === test.expectedStatus ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            console.log(`   Expected: ${test.expectedStatus}, Got: ${response.status}`);

            if (response.status !== test.expectedStatus) {
                console.log(`   Response:`, data);
            }
            console.log('');

        } catch (error) {
            console.log(`❌ ${test.name}`);
            console.log(`   Error: ${error}`);
            console.log('');
        }
    }

    console.log('🏁 API Route Tests Complete');
}

// Validation test examples
export const validationExamples = {
    validAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    invalidAddress: '0xinvalid',
    validTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    invalidTxHash: '0xinvalid',
    validAmount: 100,
    invalidAmount: -1,
    validBatchRecipients: [
        { to: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87', amount: 10 },
        { to: '0x8ba1f109551bD432803012645Hac136c5C1515BC', amount: 20 },
    ],
    invalidBatchRecipients: [
        { to: 'invalid', amount: 10 },
        { to: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87', amount: -1 },
    ],
};