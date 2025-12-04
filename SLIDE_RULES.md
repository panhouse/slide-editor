# スライドJSON生成ルール

Claude Codeがスライド用JSONを生成する際の必須ルール。

## 最重要ルール

### 話した内容を漏れなく入れる
- 会議の文字起こしやメモからスライドを作成する際は、話された内容を漏れなく反映すること
- 「要約しすぎて情報が落ちる」のはNG
- 雑談や脱線は除外してよいが、業務に関連する内容は全て拾う
- 迷ったら入れる。後から削るのは簡単だが、抜けに気づくのは難しい

### 全スライドにスピーカーノートをつける
- 全てのスライドに `speakerNotes` を必ず設定する
- スライド本文に入りきらなかった詳細情報、補足説明、発言の原文などを記載
- プレゼン時に話すべきポイントや背景情報を入れる
- 空文字（`""`）は最終スライドのみ許容

## 基本ルール

### 1. Markdown記法は使わない
- `**太字**` → 使用禁止。普通のテキストで書く
- `*斜体*` → 使用禁止
- `[リンク](url)` → 使用禁止
- 理由: エディタはMarkdownをパースしないため、そのまま表示されてしまう

### 2. フィールド名は正確に
各スライドタイプで使用するフィールド名は以下の通り。間違えるとデータが表示されない。

| スライドタイプ | 正しいフィールド名 | よくある間違い |
|--------------|------------------|--------------|
| content | `items` | ~~points~~, ~~bullets~~ |
| kpi | `metrics` | ~~kpis~~, ~~values~~ |
| icon-cards | `items` | ~~cards~~, ~~iconCards~~ |
| process | `steps` | ~~processes~~, ~~stages~~ |
| timeline | `milestones` | ~~items~~, ~~events~~ |
| roadmap | `phases` | ~~items~~, ~~milestones~~ |
| compare | `leftTitle`, `leftItems`, `rightTitle`, `rightItems` | ~~left.title~~, ~~left.items~~ |

### 3. 必須フィールド一覧

```
title:      title
content:    title, items
table:      title, headers, rows
compare:    title, leftTitle, leftItems, rightTitle, rightItems
cards:      title, items
icon-cards: title, items
process:    title, steps
timeline:   title, milestones
kpi:        title, metrics
roadmap:    title, phases
quote:      text
```

### 4. compareスライドはフラット形式で
```json
// ✅ 正しい
{
  "type": "compare",
  "title": "比較",
  "leftTitle": "Before",
  "leftItems": ["項目1", "項目2"],
  "rightTitle": "After",
  "rightItems": ["項目1", "項目2"]
}

// ❌ 間違い（ネスト形式）
{
  "type": "compare",
  "left": { "title": "Before", "items": [...] },
  "right": { "title": "After", "items": [...] }
}
```

### 5. itemsは配列で
```json
// ✅ 正しい
"items": ["項目1", "項目2", "項目3"]

// ❌ 間違い
"items": "項目1、項目2、項目3"
```

### 6. 箇条書きの書き方
強調したい部分は文頭に持ってきて、ハイフンで説明を追加する形式を推奨。

```json
// ✅ 推奨
"items": [
  "毎日配信が可能 - 人間がやると負担大だが、AIなら毎日でも可能",
  "最新情報の即時反映 - 12時のニュースを14時には解説付きで配信"
]

// ❌ 非推奨（Markdown記法）
"items": [
  "**毎日配信が可能** - 人間がやると負担大だが、AIなら毎日でも可能"
]
```

## スライドタイプ別テンプレート

### title（タイトルスライド）
```json
{
  "type": "title",
  "title": "プレゼンタイトル",
  "subtitle": "サブタイトル",
  "date": "2025年12月",
  "speakerNotes": "ノート"
}
```

### content（箇条書き）
```json
{
  "type": "content",
  "title": "スライドタイトル",
  "subhead": "サブヘッド（省略可）",
  "items": [
    "項目1",
    "項目2 - 補足説明",
    "項目3"
  ],
  "speakerNotes": "ノート"
}
```

### icon-cards（アイコン付きカード）
```json
{
  "type": "icon-cards",
  "title": "タイトル",
  "subhead": "サブヘッド",
  "columns": 3,
  "items": [
    { "icon": "🎯", "title": "カードタイトル", "desc": "説明文" },
    { "icon": "📊", "title": "カードタイトル", "desc": "説明文" },
    { "icon": "🚀", "title": "カードタイトル", "desc": "説明文" }
  ],
  "speakerNotes": "ノート"
}
```

### process（プロセスフロー）
```json
{
  "type": "process",
  "title": "タイトル",
  "subhead": "サブヘッド",
  "steps": [
    { "title": "ステップ1", "desc": "説明" },
    { "title": "ステップ2", "desc": "説明" },
    { "title": "ステップ3", "desc": "説明" }
  ],
  "speakerNotes": "ノート"
}
```

### kpi（KPIカード）
```json
{
  "type": "kpi",
  "title": "タイトル",
  "subhead": "サブヘッド",
  "metrics": [
    { "icon": "📈", "value": "50%", "label": "向上率", "desc": "補足" },
    { "icon": "⚡", "value": "3倍", "label": "スピード", "desc": "補足" }
  ],
  "speakerNotes": "ノート"
}
```

### compare（左右比較）
```json
{
  "type": "compare",
  "title": "タイトル",
  "subhead": "サブヘッド",
  "leftTitle": "Before",
  "leftItems": ["項目1", "項目2", "項目3"],
  "rightTitle": "After",
  "rightItems": ["項目1", "項目2", "項目3"],
  "speakerNotes": "ノート"
}
```

### table（テーブル）
```json
{
  "type": "table",
  "title": "タイトル",
  "subhead": "サブヘッド",
  "headers": ["列1", "列2", "列3"],
  "rows": [
    ["データ1-1", "データ1-2", "データ1-3"],
    ["データ2-1", "データ2-2", "データ2-3"]
  ],
  "speakerNotes": "ノート"
}
```

### timeline（タイムライン）
```json
{
  "type": "timeline",
  "title": "タイトル",
  "milestones": [
    { "date": "2025年1月", "title": "マイルストーン1", "desc": "説明" },
    { "date": "2025年3月", "title": "マイルストーン2", "desc": "説明" }
  ],
  "speakerNotes": "ノート"
}
```

## チェックリスト（JSON生成時に確認）

- [ ] `**太字**`などのMarkdown記法を使っていないか
- [ ] フィールド名は正しいか（items, metrics, steps等）
- [ ] compareはフラット形式か（leftTitle, leftItems...）
- [ ] 配列は`[]`で囲んでいるか
- [ ] 各オブジェクトの閉じ括弧は正しいか
- [ ] JSONとして有効か（カンマの位置等）

---
最終更新: 2025-12-04
