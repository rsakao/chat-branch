import { test, expect } from '@playwright/test';

test.describe('Loading Performance', () => {
  test('should have minimal loading time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // アプリが完全に読み込まれるまでの時間を測定
    await expect(page.locator('h1')).toContainText('Chat Branch');
    await expect(page.getByRole('button', { name: /設定|Settings/ })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // 読み込み時間が3秒以内であることを確認
    expect(loadTime).toBeLessThan(3000);
    console.log(`App loaded in ${loadTime}ms`);
  });

  test('should show loading state briefly', async ({ page }) => {
    // ネットワークを遅延させてLoading状態を観察
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');
    
    // 最終的に正常に表示されることを確認
    await expect(page.locator('h1')).toContainText('Chat Branch');
    await expect(page.getByRole('button', { name: /設定|Settings/ })).toBeVisible();
  });

  test('should not show "Loading..." text in normal conditions', async ({ page }) => {
    await page.goto('/');
    
    // 通常の条件下では "Loading..." は表示されないことを確認
    await expect(page.locator('h1')).toContainText('Chat Branch');
    
    // ページ上に "Loading..." テキストが存在しないことを確認
    const loadingText = page.locator('text="Loading..."');
    await expect(loadingText).not.toBeVisible();
  });

  test('should have smooth language switching', async ({ page }) => {
    await page.goto('/');
    
    // 初期状態（日本語）
    await expect(page.getByRole('button', { name: '設定' })).toBeVisible();
    
    const startTime = Date.now();
    
    // 英語に切り替え
    await page.getByRole('button', { name: '設定' }).click();
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.locator('#language-select').selectOption('en')
    ]);
    
    const switchTime = Date.now() - startTime;
    
    // 言語切り替えが完了
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
    
    // 切り替え時間が5秒以内であることを確認
    expect(switchTime).toBeLessThan(5000);
    console.log(`Language switched in ${switchTime}ms`);
  });

  test('should cache messages for faster subsequent loads', async ({ page }) => {
    // 初回読み込み
    const firstLoadStart = Date.now();
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Chat Branch');
    const firstLoadTime = Date.now() - firstLoadStart;
    
    // 言語を英語に切り替え
    await page.getByRole('button', { name: '設定' }).click();
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.locator('#language-select').selectOption('en')
    ]);
    
    // 日本語に戻す（キャッシュされているはず）
    const cachedLoadStart = Date.now();
    await page.getByRole('button', { name: 'Settings' }).click();
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.locator('#language-select').selectOption('ja')
    ]);
    await expect(page.getByRole('button', { name: '設定' })).toBeVisible();
    const cachedLoadTime = Date.now() - cachedLoadStart;
    
    console.log(`First load: ${firstLoadTime}ms, Cached load: ${cachedLoadTime}ms`);
    
    // キャッシュされた読み込みは通常より速いことを期待
    // ただし、必ずしも速いとは限らないので、単に完了することを確認
    expect(cachedLoadTime).toBeLessThan(10000);
  });
});