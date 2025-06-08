# Test info

- Name: Internationalization Features >> should persist language preference
- Location: /workspace/tests/internationalization.spec.ts:85:7

# Error details

```
Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - waiting for navigation until "load"

    at /workspace/tests/internationalization.spec.ts:94:16
```

# Page snapshot

```yaml
- text: Loading...
- alert
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Internationalization Features', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // 各テスト前にページを読み込み、ローカルストレージをクリア
   6 |     await page.goto('/');
   7 |     await page.evaluate(() => localStorage.clear());
   8 |     await page.reload();
   9 |   });
   10 |
   11 |   test('should display Japanese by default', async ({ page }) => {
   12 |     await page.goto('/');
   13 |     
   14 |     // デフォルトで日本語が表示されているかチェック
   15 |     await expect(page.locator('h1')).toContainText('Chat Branch');
   16 |     
   17 |     // 設定ボタンが日本語で表示されているかチェック
   18 |     const settingsButton = page.getByRole('button', { name: '設定' });
   19 |     await expect(settingsButton).toBeVisible();
   20 |     
   21 |     // ステータスが日本語で表示されているかチェック
   22 |     const statusText = page.locator('.status-text');
   23 |     await expect(statusText).toContainText(/準備完了|応答生成中/);
   24 |   });
   25 |
   26 |   test('should open settings modal', async ({ page }) => {
   27 |     await page.goto('/');
   28 |     
   29 |     // 設定ボタンをクリック
   30 |     const settingsButton = page.getByRole('button', { name: '設定' });
   31 |     await settingsButton.click();
   32 |     
   33 |     // 設定モーダルが開くかチェック
   34 |     const modal = page.locator('.modal');
   35 |     await expect(modal).toBeVisible();
   36 |     
   37 |     // モーダルのタイトルが表示されているかチェック
   38 |     const modalTitle = page.locator('.modal h3');
   39 |     await expect(modalTitle).toContainText('設定');
   40 |   });
   41 |
   42 |   test('should have language selector in settings', async ({ page }) => {
   43 |     await page.goto('/');
   44 |     
   45 |     // 設定を開く
   46 |     await page.getByRole('button', { name: '設定' }).click();
   47 |     
   48 |     // 言語セレクターが存在するかチェック
   49 |     const languageSelector = page.locator('#language-select');
   50 |     await expect(languageSelector).toBeVisible();
   51 |     
   52 |     // 言語ラベルが表示されているかチェック
   53 |     const languageLabel = page.locator('label[for="language-select"]');
   54 |     await expect(languageLabel).toContainText('言語');
   55 |     
   56 |     // 日本語と英語のオプションが存在するかチェック
   57 |     const jaOption = page.locator('option[value="ja"]');
   58 |     const enOption = page.locator('option[value="en"]');
   59 |     await expect(jaOption).toBeAttached();
   60 |     await expect(enOption).toBeAttached();
   61 |   });
   62 |
   63 |   test('should switch to English when selected', async ({ page }) => {
   64 |     await page.goto('/');
   65 |     
   66 |     // 設定を開く
   67 |     await page.getByRole('button', { name: '設定' }).click();
   68 |     
   69 |     // 英語に切り替え
   70 |     const languageSelector = page.locator('#language-select');
   71 |     await languageSelector.selectOption('en');
   72 |     
   73 |     // ページがリロードされるのを待つ
   74 |     await page.waitForLoadState('domcontentloaded');
   75 |     
   76 |     // 英語表示に切り替わっているかチェック
   77 |     const settingsButton = page.getByRole('button', { name: 'Settings' });
   78 |     await expect(settingsButton).toBeVisible();
   79 |     
   80 |     // ステータスが英語で表示されているかチェック
   81 |     const statusText = page.locator('.status-text');
   82 |     await expect(statusText).toContainText(/Ready|Generating/);
   83 |   });
   84 |
   85 |   test('should persist language preference', async ({ page }) => {
   86 |     await page.goto('/');
   87 |     
   88 |     // 言語を英語に切り替え
   89 |     await page.getByRole('button', { name: '設定' }).click();
   90 |     await page.locator('#language-select').selectOption('en');
   91 |     await page.waitForLoadState('domcontentloaded');
   92 |     
   93 |     // ページを再読み込み
>  94 |     await page.reload();
      |                ^ Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
   95 |     
   96 |     // 英語設定が保持されているかチェック
   97 |     const settingsButton = page.getByRole('button', { name: 'Settings' });
   98 |     await expect(settingsButton).toBeVisible();
   99 |     
  100 |     // ローカルストレージに設定が保存されているかチェック
  101 |     const savedLocale = await page.evaluate(() => localStorage.getItem('locale'));
  102 |     expect(savedLocale).toBe('en');
  103 |   });
  104 |
  105 |   test('should have English content when switched', async ({ page }) => {
  106 |     await page.goto('/');
  107 |     
  108 |     // 英語に切り替え
  109 |     await page.getByRole('button', { name: '設定' }).click();
  110 |     await page.locator('#language-select').selectOption('en');
  111 |     await page.waitForLoadState('domcontentloaded');
  112 |     
  113 |     // 設定を再度開く
  114 |     await page.getByRole('button', { name: 'Settings' }).click();
  115 |     
  116 |     // 設定モーダルが英語で表示されているかチェック
  117 |     const modalTitle = page.locator('.modal h3');
  118 |     await expect(modalTitle).toContainText('Settings');
  119 |     
  120 |     // 言語ラベルが英語で表示されているかチェック
  121 |     const languageLabel = page.locator('label[for="language-select"]');
  122 |     await expect(languageLabel).toContainText('Language');
  123 |   });
  124 |
  125 |   test('should switch back to Japanese', async ({ page }) => {
  126 |     await page.goto('/');
  127 |     
  128 |     // まず英語に切り替え
  129 |     await page.getByRole('button', { name: '設定' }).click();
  130 |     await page.locator('#language-select').selectOption('en');
  131 |     await page.waitForLoadState('domcontentloaded');
  132 |     
  133 |     // 日本語に戻す
  134 |     await page.getByRole('button', { name: 'Settings' }).click();
  135 |     await page.locator('#language-select').selectOption('ja');
  136 |     await page.waitForLoadState('domcontentloaded');
  137 |     
  138 |     // 日本語表示に戻っているかチェック
  139 |     const settingsButton = page.getByRole('button', { name: '設定' });
  140 |     await expect(settingsButton).toBeVisible();
  141 |     
  142 |     // ローカルストレージが更新されているかチェック
  143 |     const savedLocale = await page.evaluate(() => localStorage.getItem('locale'));
  144 |     expect(savedLocale).toBe('ja');
  145 |   });
  146 | });
```