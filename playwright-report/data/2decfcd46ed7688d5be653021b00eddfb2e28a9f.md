# Test info

- Name: Chat Branch App >> should have main navigation elements
- Location: /workspace/tests/app.spec.ts:14:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('.mobile-nav-btn').first()
Expected: visible
Received: hidden
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('.mobile-nav-btn').first()
    9 × locator resolved to <button aria-label="会話履歴を開く" class="mobile-nav-btn ">…</button>
      - unexpected value "hidden"

    at /workspace/tests/app.spec.ts:23:33
```

# Page snapshot

```yaml
- banner:
  - heading "Chat Branch" [level=1]
  - text: 準備完了
  - button "設定"
- main:
  - complementary:
    - heading "会話履歴" [level=3]
    - button "新規会話"
    - paragraph: 会話がありません
    - paragraph: 新規会話を作成してください
  - heading "会話を選択してください" [level=2]
  - paragraph: 左のサイドバーから会話を選択するか、新しい会話を作成してください。
  - complementary:
    - heading "会話ツリー" [level=3]
    - combobox:
      - option "自動選択" [selected]
      - option "シンプル表示"
      - option "ツリーレイアウト"
    - paragraph: 会話を選択してください
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Chat Branch App', () => {
   4 |   test('should load the application successfully', async ({ page }) => {
   5 |     await page.goto('/');
   6 |     
   7 |     // アプリタイトルが正しく表示されているかチェック
   8 |     await expect(page).toHaveTitle(/Chat Branch/);
   9 |     
  10 |     // メインヘッダーのタイトルが表示されているかチェック
  11 |     await expect(page.locator('h1')).toContainText('Chat Branch');
  12 |   });
  13 |
  14 |   test('should have main navigation elements', async ({ page }) => {
  15 |     await page.goto('/');
  16 |     
  17 |     // 設定ボタンが存在するかチェック
  18 |     const settingsButton = page.getByRole('button', { name: /設定|Settings/ });
  19 |     await expect(settingsButton).toBeVisible();
  20 |     
  21 |     // サイドバートグルボタンが存在するかチェック（モバイル用）
  22 |     const sidebarToggle = page.locator('.mobile-nav-btn').first();
> 23 |     await expect(sidebarToggle).toBeVisible();
     |                                 ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  24 |     
  25 |     // ツリートグルボタンが存在するかチェック（モバイル用）
  26 |     const treeToggle = page.locator('.mobile-nav-btn').last();
  27 |     await expect(treeToggle).toBeVisible();
  28 |   });
  29 |
  30 |   test('should display status indicator', async ({ page }) => {
  31 |     await page.goto('/');
  32 |     
  33 |     // ステータスインジケーターが表示されているかチェック
  34 |     const statusIndicator = page.locator('.status-indicator');
  35 |     await expect(statusIndicator).toBeVisible();
  36 |     
  37 |     // ステータステキストが表示されているかチェック
  38 |     const statusText = page.locator('.status-text');
  39 |     await expect(statusText).toBeVisible();
  40 |     await expect(statusText).toContainText(/準備完了|Ready|応答生成中|Generating/);
  41 |   });
  42 |
  43 |   test('should have conversation sidebar', async ({ page }) => {
  44 |     await page.goto('/');
  45 |     
  46 |     // サイドバーが存在するかチェック
  47 |     const sidebar = page.locator('.sidebar');
  48 |     const sidebarExists = await sidebar.count() > 0;
  49 |     
  50 |     if (sidebarExists) {
  51 |       // サイドバーが存在する場合、表示されているか非表示かをチェック
  52 |       try {
  53 |         await expect(sidebar).toBeInViewport({ ratio: 0.1 });
  54 |       } catch {
  55 |         // 非表示の場合もOK（モバイルビューの可能性）
  56 |         await expect(sidebar).toBeAttached();
  57 |       }
  58 |     }
  59 |     
  60 |     // 新規会話ボタンの存在をチェック
  61 |     const newConversationButton = page.getByRole('button', { name: /新規会話|New Conversation/ });
  62 |     const buttonExists = await newConversationButton.count() > 0;
  63 |     
  64 |     if (buttonExists) {
  65 |       // ボタンが存在する場合のテスト（表示または非表示どちらでも可）
  66 |       await expect(newConversationButton).toBeAttached();
  67 |     }
  68 |   });
  69 |
  70 |   test('should have chat area', async ({ page }) => {
  71 |     await page.goto('/');
  72 |     
  73 |     // チャットエリアが存在するかチェック
  74 |     const chatArea = page.locator('[role="main"], .main-content');
  75 |     await expect(chatArea).toBeVisible();
  76 |   });
  77 | });
```