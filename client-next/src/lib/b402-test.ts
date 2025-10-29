// Simple test utility to diagnose API issues
export async function testBasicConnectivity() {
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';

    console.log('🔍 Testing API Connectivity...');
    console.log(`Base URL: ${baseUrl}`);

    // Test 1: Debug endpoint (should work without blockchain connection)
    try {
        console.log('\n1. Testing debug endpoint...');
        const debugResponse = await fetch(`${baseUrl}/api/mint/debug`);
        const debugData = await debugResponse.json();

        console.log(`✅ Debug endpoint: ${debugResponse.status}`);
        console.log('Environment check:', debugData.environment);
        console.log('RPC connectivity:', debugData.rpcConnectivity);

        if (!debugData.environment.PRIVATE_KEY) {
            console.log('❌ Missing PRIVATE_KEY environment variable');
        }
        if (!debugData.environment.MINT_CONTRACT_ADDRESS) {
            console.log('❌ Missing MINT_CONTRACT_ADDRESS environment variable');
        }

    } catch (error) {
        console.log(`❌ Debug endpoint failed: ${error}`);
        return false;
    }

    // Test 2: Health endpoint (requires blockchain connection)
    try {
        console.log('\n2. Testing health endpoint...');
        const healthResponse = await fetch(`${baseUrl}/api/mint/health`);
        const healthData = await healthResponse.json();

        console.log(`Health endpoint: ${healthResponse.status}`);
        console.log('Overall status:', healthData.status);

        if (healthData.checks) {
            healthData.checks.forEach((check: any) => {
                const icon = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
                console.log(`${icon} ${check.name}: ${check.message}`);
            });
        }

    } catch (error) {
        console.log(`❌ Health endpoint failed: ${error}`);
        console.log('This might indicate blockchain connectivity issues');
    }

    // Test 3: Simple validation test
    try {
        console.log('\n3. Testing validation...');
        const validationResponse = await fetch(`${baseUrl}/api/mint/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                txHash: 'invalid-hash'
            }),
        });

        const validationData = await validationResponse.json();
        console.log(`Validation test: ${validationResponse.status} (expected 400)`);

        if (validationResponse.status === 400) {
            console.log('✅ Validation working correctly');
        } else {
            console.log('❌ Validation not working as expected');
        }

    } catch (error) {
        console.log(`❌ Validation test failed: ${error}`);
    }

    console.log('\n🏁 Connectivity test complete');
    return true;
}

// Function to test from browser console
export function runBrowserTest() {
    if (typeof window !== 'undefined') {
        testBasicConnectivity();
    } else {
        console.log('This function should be run in the browser');
    }
}

// Export for global access in browser
if (typeof window !== 'undefined') {
    (window as any).testB402 = runBrowserTest;
    (window as any).testBasicConnectivity = testBasicConnectivity;
}