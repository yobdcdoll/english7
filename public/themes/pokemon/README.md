# 宝可梦主题图片（M1 预留）

M0 **不会加载**这里的图片，所有卡片使用内容里的 emoji。这个目录是给 M1 主题层预留的：家长自行放入图片后，主题层按场景 id 找图，不改动教学内容。

## 命名

文件名必须等于 `src/data/content.json` 中场景的 `id`，扩展名为 `.png`（例如 `look-at-cat.png`）。

当前场景 id：

- `look-at-cat`、`look-at-tree`、`look-at-star`
- `this-is-apple`、`this-is-ball`、`this-is-card`
- `that-is-moon`、`that-is-bird`、`that-is-bus`

基线测的题目使用单独 id，不属于语块场景，不需要主题图。

## 版权

宝可梦官方图片受版权保护。**只可用于私人家庭使用，绝对不要把官方素材提交到公开仓库或再分发。** 本仓库应保持私有；如果之后要公开代码，请先清空这个目录，或改用自己绘制/有明确授权的图片。

图片缺失时主题层应退回 emoji，不影响使用。
