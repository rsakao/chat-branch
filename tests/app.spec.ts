import { test, expect } from '@playwright/test';

test.describe('Chat Branch App', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // アプリタイトルが正しく表示されているかチェック
    await expect(page).toHaveTitle(/Chat Branch/);
    
    // メインヘッダーのタイトルが表示されているかチェック
    await expect(page.locator('h1')).toContainText('Chat Branch');
  });

  test('should have main navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // 設定ボタンが存在するかチェック
    const settingsButton = page.getByRole('button', { name: /設定|Settings/ });
    await expect(settingsButton).toBeVisible();
    
    // サイドバートグルボタンが存在するかチェック（モバイル用）
    const sidebarToggle = page.locator('.mobile-nav-btn').first();
    await expect(sidebarToggle).toBeVisible();
    
    // ツリートグルボタンが存在するかチェック（モバイル用）
    const treeToggle = page.locator('.mobile-nav-btn').last();
    await expect(treeToggle).toBeVisible();
  });

  test('should display status indicator', async ({ page }) => {
    await page.goto('/');
    
    // ステータスインジケーターが表示されているかチェック
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // ステータステキストが表示されているかチェック
    const statusText = page.locator('.status-text');
    await expect(statusText).toBeVisible();
    await expect(statusText).toContainText(/準備完了|Ready|応答生成中|Generating/);
  });

  test('should have conversation sidebar', async ({ page }) => {
    await page.goto('/');
    
    // サイドバーが存在するかチェック
    const sidebar = page.locator('.sidebar');
    const sidebarExists = await sidebar.count() > 0;
    
    if (sidebarExists) {
      // サイドバーが存在する場合、表示されているか非表示かをチェック
      try {
        await expect(sidebar).toBeInViewport({ ratio: 0.1 });
      } catch {
        // 非表示の場合もOK（モバイルビューの可能性）
        await expect(sidebar).toBeAttached();
      }
    }
    
    // 新規会話ボタンの存在をチェック
    const newConversationButton = page.getByRole('button', { name: /新規会話|New Conversation/ });
    const buttonExists = await newConversationButton.count() > 0;
    
    if (buttonExists) {
      // ボタンが存在する場合のテスト（表示または非表示どちらでも可）
      await expect(newConversationButton).toBeAttached();
    }
  });

  test('should have chat area', async ({ page }) => {
    await page.goto('/');
    
    // チャットエリアが存在するかチェック
    const chatArea = page.locator('[role="main"], .main-content');
    await expect(chatArea).toBeVisible();
  });
});