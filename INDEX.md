# 实体 ID 总索引

> 新增 ID 必须先查此表，确认无冲突后再写入 JSON，并更新本文件。

## 功法 (skill_*)

| ID | 名称 | 类别 | 文件 |
|----|------|------|------|
| skill_internal_001_huntuan | 混元功 | internal | data/skills/internal/index.json |
| skill_internal_002_tuna | 吐纳诀 | internal | data/skills/internal/index.json |
| skill_internal_003_xiaozhou | 小周天功 | internal | data/skills/internal/index.json |
| skill_internal_004_jingang | 金刚诀 | internal | data/skills/internal/index.json |
| skill_hard_050_tiebu | 铁布衫 | hard | data/skills/hard/index.json |
| skill_hard_051_shigang | 石罡身 | hard | data/skills/hard/index.json |
| skill_qinggong_040_caoying | 草影步 | qinggong | data/skills/qinggong/index.json |
| skill_qinggong_041_zhuifeng | 追风步 | qinggong | data/skills/qinggong/index.json |
| skill_sword_010_qingmang | 青蟒剑法 | sword | data/skills/sword/index.json |
| skill_sword_011_baihong | 白虹剑法 | sword | data/skills/sword/index.json |
| skill_sword_012_liushui | 流水剑法 | sword | data/skills/sword/index.json |
| skill_sword_013_songfeng | 松风剑法 | sword | data/skills/sword/index.json |
| skill_sword_014_shexing | 蛇行剑路 | sword | data/skills/sword/index.json |
| skill_sword_020_sheying | 蛇影剑谱 | sword | data/skills/sword/index.json |
| skill_sword_030_tianmang | 天蟒剑典 | sword | data/skills/sword/index.json |

## 招式 (move_*)

| ID | 所属功法 | 文件 |
|----|----------|------|
| move_huntuan_01 | skill_internal_001_huntuan | data/skills/internal/index.json |
| move_tuna_01 | skill_internal_002_tuna | data/skills/internal/index.json |
| move_tuna_02 | skill_internal_002_tuna | data/skills/internal/index.json |
| move_xiaozhou_01 | skill_internal_003_xiaozhou | data/skills/internal/index.json |
| move_xiaozhou_02 | skill_internal_003_xiaozhou | data/skills/internal/index.json |
| move_jingang_01 | skill_internal_004_jingang | data/skills/internal/index.json |
| move_tiebu_01 | skill_hard_050_tiebu | data/skills/hard/index.json |
| move_tiebu_02 | skill_hard_050_tiebu | data/skills/hard/index.json |
| move_shigang_01 | skill_hard_051_shigang | data/skills/hard/index.json |
| move_shigang_02 | skill_hard_051_shigang | data/skills/hard/index.json |
| move_caoying_01 | skill_qinggong_040_caoying | data/skills/qinggong/index.json |
| move_caoying_02 | skill_qinggong_040_caoying | data/skills/qinggong/index.json |
| move_zhuifeng_01 | skill_qinggong_041_zhuifeng | data/skills/qinggong/index.json |
| move_zhuifeng_02 | skill_qinggong_041_zhuifeng | data/skills/qinggong/index.json |
| move_qingmang_01 | skill_sword_010_qingmang | data/skills/sword/index.json |
| move_qingmang_02 | skill_sword_010_qingmang | data/skills/sword/index.json |
| move_qingmang_03 | skill_sword_010_qingmang | data/skills/sword/index.json |
| move_baihong_01 | skill_sword_011_baihong | data/skills/sword/index.json |
| move_baihong_02 | skill_sword_011_baihong | data/skills/sword/index.json |
| move_liushui_01 | skill_sword_012_liushui | data/skills/sword/index.json |
| move_liushui_02 | skill_sword_012_liushui | data/skills/sword/index.json |
| move_liushui_03 | skill_sword_012_liushui | data/skills/sword/index.json |
| move_songfeng_01 | skill_sword_013_songfeng | data/skills/sword/index.json |
| move_songfeng_02 | skill_sword_013_songfeng | data/skills/sword/index.json |
| move_shexing_01 | skill_sword_014_shexing | data/skills/sword/index.json |
| move_shexing_02 | skill_sword_014_shexing | data/skills/sword/index.json |
| move_sheying_01 | skill_sword_020_sheying | data/skills/sword/index.json |
| move_sheying_02 | skill_sword_020_sheying | data/skills/sword/index.json |
| move_tianmang_01 | skill_sword_030_tianmang | data/skills/sword/index.json |
| move_tianmang_02 | skill_sword_030_tianmang | data/skills/sword/index.json |

## 功法关系 (rel_*)

| ID | 类型 | 说明 | 文件 |
|----|------|------|------|
| rel_inherit_001_qingmang_sheying | inheritance | 青蟒剑法 → 蛇影剑谱 | data/skill_relations/index.json |
| rel_inherit_002_shexing_sheying | inheritance | 蛇行剑路 → 蛇影剑谱 | data/skill_relations/index.json |
| rel_inherit_003_sheying_tianmang | inheritance | 蛇影剑谱 → 天蟒剑典 | data/skill_relations/index.json |
| rel_synergy_001_qingmang_sheying | synergy | 青蟒剑法 → 蛇影剑谱 | data/skill_relations/index.json |
| rel_synergy_002_shexing_tianmang | synergy | 蛇行剑路 → 天蟒剑典 | data/skill_relations/index.json |
| rel_synergy_003_songfeng_baihong | synergy | 松风剑法 → 白虹剑法 | data/skill_relations/index.json |
| rel_similarity_001_qingmang_sheying | similarity | 青蟒剑法 → 蛇影剑谱 | data/skill_relations/index.json |
| rel_similarity_002_shexing_sheying | similarity | 蛇行剑路 → 蛇影剑谱 | data/skill_relations/index.json |
| rel_similarity_003_sheying_tianmang | similarity | 蛇影剑谱 → 天蟒剑典 | data/skill_relations/index.json |

## 敌人 (enemy_*)

| ID | 名称 | 文件 |
|----|------|------|
| enemy_001_bandit_grunt | 山贼喽啰 | data/enemies/index.json |
| enemy_002_bandit_boss | 山贼头目 | data/enemies/index.json |
| enemy_003_wild_wolf | 野狼 | data/enemies/index.json |

## 场景 (scene_*)

| ID | 名称 | 文件 |
|----|------|------|
| scene_001_village | 主城新手村 | data/scenes/index.json |
| scene_002_outskirts | 村外野径 | data/scenes/index.json |

## NPC (npc_*)

| ID | 名称 | 文件 |
|----|------|------|
| npc_001_village_swordsman | 村口剑客 | data/npcs/index.json |

## 任务 (quest_*)

| ID | 名称 | 文件 |
|----|------|------|
| quest_main_001_first_blood | 初战告捷（奖励：白虹剑法） | data/quests/index.json |

## 玩家 (player_*)

| ID | 名称 | 说明 |
|----|------|------|
| player_001 | 无名侠客 | store/gameStore.ts defaultPlayer |
