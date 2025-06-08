import { test, expect } from '@playwright/test';

test.describe('Internationalization Features', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にページを読み込み、ローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display Japanese by default', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトで日本語が表示されているかチェック
    await expect(page.locator('h1')).toContainText('Chat Branch');
    
    // 設定ボタンが日本語で表示されているかチェック
    const settingsButton = page.getByRole('button', { name: '設定' });
    await expect(settingsButton).toBeVisible();
    
    // ステータスが日本語で表示されているかチェック
    const statusText = page.locator('.status-text');
    await expect(statusText).toContainText(/準備完了|応答生成中/);
  });

  test('should open settings modal', async ({ page }) => {
    await page.goto('/');
    
    // 設定ボタンをクリック
    const settingsButton = page.getByRole('button', { name: '設定' });
    await settingsButton.click();
    
    // 設定モーダルが開くかチェック
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    
    // モーダルのタイトルが表示されているかチェック
    const modalTitle = page.locator('.modal h3');
    await expect(modalTitle).toContainText('設定');
  });

  test('should have language selector in settings', async ({ page }) => {
    await page.goto('/');
    
    // 設定を開く
    await page.getByRole('button', { name: '設定' }).click();
    
    // 言語セレクターが存在するかチェック
    const languageSelector = page.locator('#language-select');
    await expect(languageSelector).toBeVisible();
    
    // 言語ラベルが表示されているかチェック
    const languageLabel = page.locator('label[for="language-select"]');
    await expect(languageLabel).toContainText('言語');
    
    // 日本語と英語のオプションが存在するかチェック
    const jaOption = page.locator('option[value="ja"]');
    const enOption = page.locator('option[value="en"]');
    await expect(jaOption).toBeAttached();
    await expect(enOption).toBeAttached();
  });

  test('should switch to English when selected', async ({ page }) => {
    await page.goto('/');
    
    // 設定を開く
    await page.getByRole('button', { name: '設定' }).click();
    
    // 英語に切り替え
    const languageSelector = page.locator('#language-select');
    await languageSelector.selectOption('en');
    
    // ページがリロードされるのを待つ
    await page.waitForLoadState('domcontentloaded');
    
    // 英語表示に切り替わっているかチェック
    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await expect(settingsButton).toBeVisible();
    
    // ステータスが英語で表示されているかチェック
    const statusText = page.locator('.status-text');
    await expect(statusText).toContainText(/Ready|Generating/);
  });

  test('should persist language preference', async ({ page }) => {
    await page.goto('/');
    
    // 言語を英語に切り替え
    await page.getByRole('button', { name: '設定' }).click();
    await page.locator('#language-select').selectOption('en');
    await page.waitForLoadState('domcontentloaded');
    
    // ページを再読み込み
    await page.reload();
    
    // 英語設定が保持されているかチェック
    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await expect(settingsButton).toBeVisible();
    
    // ローカルストレージに設定が保存されているかチェック
    const savedLocale = await page.evaluate(() => localStorage.getItem('locale'));
    expect(savedLocale).toBe('en');
  });

  test('should have English content when switched', async ({ page }) => {
    await page.goto('/');
    
    // 英語に切り替え
    await page.getByRole('button', { name: '設定' }).click();
    await page.locator('#language-select').selectOption('en');
    await page.waitForLoadState('domcontentloaded');
    
    // 設定を再度開く
    await page.getByRole('button', { name: 'Settings' }).click();
    
    // 設定モーダルが英語で表示されているかチェック
    const modalTitle = page.locator('.modal h3');
    await expect(modalTitle).toContainText('Settings');
    
    // 言語ラベルが英語で表示されているかチェック
    const languageLabel = page.locator('label[for="language-select"]');
    await expect(languageLabel).toContainText('Language');
  });

  test('should switch back to Japanese', async ({ page }) => {
    await page.goto('/');
    
    // まず英語に切り替え
    await page.getByRole('button', { name: '設定' }).click();
    await page.locator('#language-select').selectOption('en');
    await page.waitForLoadState('domcontentloaded');
    
    // 日本語に戻す
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.locator('#language-select').selectOption('ja');
    await page.waitForLoadState('domcontentloaded');
    
    // 日本語表示に戻っているかチェック
    const settingsButton = page.getByRole('button', { name: '設定' });
    await expect(settingsButton).toBeVisible();
    
    // ローカルストレージが更新されているかチェック
    const savedLocale = await page.evaluate(() => localStorage.getItem('locale'));
    expect(savedLocale).toBe('ja');
  });
});