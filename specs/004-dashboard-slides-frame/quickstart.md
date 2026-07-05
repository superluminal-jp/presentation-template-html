# Quickstart: 共通フレーム & ダッシュボード実践スライド

**Feature**: 004-dashboard-slides-frame | **Date**: 2026-07-05

## 使う(著者)

1. **取扱区分の設定**: 各スライド `data-confidentiality="1|2|3"` を設定(1=公開可/2=要保護/3=厳重)。`:root` に付ければデック全体の既定になる。
2. **組織名 / Copyright**: `.frame__scope`(「［組織名］限定」)と `.frame__copyright`(「© 2026 ［組織名］」)のプレースホルダを差し替える。
3. **ページ番号**: `js/frame.js` がデック内で自動採番(n / N)。編集不要。
4. **ダッシュボード**: 付録のダッシュボード・スライドを複製し、KPI カードと多系列チャートに値を差し込む。系列色は `--cat-1..7` を使う。

## 検証

```bash
npm run lint:tokens                  # SC-002(frame/dashboard もハードコード0)
node tests/a11y/contrast-tokens.mjs  # SC-005(カテゴリ配色 ≥3:1 + 機密性注意色 AA)
npm run test:visual                  # SC-001/003/004(フレーム4要素・機密性切替・overflow, 要ブラウザ)
npm run test:print                   # SC-006(印刷でフレーム保持, 要ブラウザ)
```

## DoD

- 全スライドに四隅フレーム(Copyright/ページ番号/組織限定/機密性)。
- 機密性 1/2/3 で表示が変わる。
- ダッシュボード付録が grid 整列 KPI + 多系列 + 凡例で崩れない。
- カテゴリ配色が 7 パレット由来・AA/識別可。
- フレームが印刷で保持。
- 整合記録 `docs/dashboard-consistency.md` あり。
