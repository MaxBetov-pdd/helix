
import { chromium } from 'playwright';

async function runTest() {
    console.log('Starting Manual Trading Verification...');

    // Launch browser (headless by default, but logs will confirm actions)
    // We use the new environment so HOME is set correctly
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Navigate to Paper Trading
        console.log('Navigating to http://localhost:5173/paper-trading...');
        await page.goto('http://localhost:5173/paper-trading');

        // Wait for load
        await page.waitForLoadState('networkidle');
        console.log('Page loaded.');

        // 2. Select Manual Mode
        console.log('Switching to MANUAL TERMINAL...');
        const manualTab = page.getByRole('button', { name: 'MANUAL TERMINAL' });
        await manualTab.click();

        // UI Check
        await page.waitForSelector('.order-entry');
        console.log('Order Entry panel visible.');
        await page.waitForSelector('.account-summary');
        console.log('Account Summary visible.');

        // 3. Execute Market Buy
        console.log('Executing Market Buy Order (BTC/USDT)...');

        // Ensure we are on market tab
        await page.getByRole('button', { name: 'MARKET' }).click();

        // Set quantity (default is likely fine but let's be explicit)
        // Actually the default 0.01 is fine for test

        // Click Buying
        const buyBtn = page.locator('.buy-btn');
        const initialBalanceText = await page.locator('.account-summary .metric:has-text("BALANCE") .value').textContent();
        console.log(`Initial Balance: ${initialBalanceText}`);

        await buyBtn.click();
        console.log('Buy button clicked.');

        // 4. Verify Position
        console.log('Verifying Position...');
        // Wait for position in table
        const positionRow = page.locator('.positions-panel table tbody tr').first();
        await positionRow.waitFor({ state: 'visible', timeout: 5000 });

        const symbolText = await positionRow.locator('.symbol').textContent() ?? '';
        const sideText = await positionRow.locator('td:nth-child(2)').textContent() ?? '';

        console.log(`Position Found: ${symbolText} ${sideText}`);

        if (!symbolText.includes('BTC/USDT') || !sideText.includes('LONG')) {
            throw new Error('Position verification failed: Incorrect symbol or side');
        }

        // 5. Place Limit Sell
        console.log('Placing Limit Sell Order...');
        await page.getByRole('button', { name: 'LIMIT' }).click();

        // Set Price higher than current
        const priceInput = page.locator('#limit-price');
        const currentPriceVal = await priceInput.inputValue();
        const limitPrice = (parseFloat(currentPriceVal) * 1.05).toFixed(2);

        await priceInput.fill(limitPrice);
        console.log(`Limit Price set to ${limitPrice}`);

        const sellBtn = page.locator('.sell-btn');
        await sellBtn.click();
        console.log('Sell button clicked.');

        // 6. Verify Order
        console.log('Verifying Order...');
        await page.getByRole('button', { name: 'ORDERS' }).click();

        const orderRow = page.locator('.positions-panel table tbody tr').first();
        await orderRow.waitFor({ state: 'visible', timeout: 5000 });

        const orderType = await orderRow.locator('td:nth-child(2)').textContent() ?? '';
        const orderSide = await orderRow.locator('td:nth-child(3)').textContent() ?? '';

        console.log(`Order Found: ${orderType} ${orderSide}`);

        if (!orderType.includes('LIMIT') || !orderSide.includes('SELL')) {
            throw new Error('Order verification failed');
        }

        console.log('SUCCESS: All verification steps passed.');

    } catch (error) {
        console.error('TEST FAILED:', error);
        // Take screenshot on failure
        await page.screenshot({ path: 'test-failure.png' });
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTest();
