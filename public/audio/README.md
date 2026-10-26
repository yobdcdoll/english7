# 音频文件（可选）

应用优先播放这里的 MP3；找不到文件或播放失败时，退回浏览器的英文 TTS（`speechSynthesis`）。M0 不要求预先放入任何音频。

## 命名

文件名必须严格等于 `src/data/content.json` 里的 `audioId`，扩展名为 `.mp3`。例如：

- `look-at-cat.mp3`
- `look-at-tree.mp3`
- `this-is-apple.mp3`
- `base-look-cat.mp3`
- `base-whats-this.mp3`

当前内容用到的 `audioId`：

- 语块场景：`look-at-cat`、`look-at-tree`、`look-at-star`、`this-is-apple`、`this-is-ball`、`this-is-card`、`that-is-moon`、`that-is-bird`、`that-is-bus`
- 基线理解：`base-look-cat`、`base-look-apple`、`base-this-ball`、`base-that-moon`、`base-look-tree`、`base-this-bird`、`base-in-box`、`base-give-apple`
- 基线听辨：`base-rep-look-cat`、`base-rep-this-apple`、`base-rep-that-ball`、`base-rep-wheres-dog`
- 基线产出：`base-whats-this`（四个产出题共用）

## 生成示例

用 edge-tts 的儿童英语音色预生成：

```bash
edge-tts --voice en-US-AnaNeural \
  --text "Look at the cat." \
  --write-media public/audio/look-at-cat.mp3
```

逐条替换 `--text` 和输出文件名即可。句子文本以 `src/data/content.json` 的 `utterance` 为准；改了文本也要重新生成对应音频。

## 说明

- 文件缺失是正常的：第一次播放失败后，本次运行会记住该 `audioId` 并直接用浏览器 TTS。
- 建议用 MP3；其他格式即使改了扩展名也可能无法播放。
- 音频只影响发音质量，不影响调度与记录。
