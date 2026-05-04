# Laya Unity Demo 说明

本文档说明当前 Laya 项目的场景组织方式、场景脚本绑定关系、Unity 导出资源放置路径，以及导出资源同步工具的使用方法。

## 目录结构

```text
Laya/project/
├── laya/pages/              # Laya IDE 编辑的 2D 场景源文件
├── src/
│   ├── Main.ts              # 项目入口、Laya 初始化、场景 runtime 注册
│   └── scenes/              # 场景对应的 TypeScript 逻辑
├── bin/
│   ├── Scene/               # Unity 导出的 3D 场景资源，通常包含 .ls
│   ├── Prefab/              # Unity 导出的 3D 预制体资源，通常包含 .lh
│   ├── *.json               # Laya IDE 导出的 2D 场景运行时 JSON
│   └── js/bundle.js         # TypeScript 编译后的运行代码
```

Unity 工程相关目录：

```text
Unity/project/
├── Laya_Export/             # Unity LayaAir 插件的导出目录
└── Tools/
    └── sync_laya_export.py  # 导出资源同步脚本
```

## Laya 场景和场景脚本

Laya IDE 中创建的 2D 场景文件放在 `laya/pages/` 下，例如：

- `laya/pages/Start.scene`
- `laya/pages/CommonUI.scene`

这些 `.scene` 文件是编辑器源文件。运行时会使用 `bin/Start.json`、`bin/CommonUI.json` 这类导出的 JSON 文件。

场景脚本放在 `src/scenes/` 下：

- `src/scenes/StartScene.ts`
- `src/scenes/CommonUIScene.ts`
- `src/scenes/Unity3DScenePage.ts`
- `src/scenes/UnitySceneConfig.ts`

场景和脚本的绑定方式是通过 `.scene` 根节点上的 `runtime` 字段完成的，例如：

```json
{
  "runtime": "StartScene"
}
```

然后在 `src/Main.ts` 中注册 runtime 类：

```ts
Laya.ClassUtils.regClass("StartScene", StartScene);
Laya.ClassUtils.regClass("CommonUIScene", CommonUIScene);
```

注意：`src/GameConfig.ts` 是 Laya IDE 自动生成配置，容易被 IDE 覆盖。手写的场景注册逻辑放在 `src/Main.ts` 里更稳。

## 当前场景职责

`Start.scene` 是启动场景，对应脚本是 `StartScene.ts`。

`StartScene.ts` 会读取 `UnitySceneConfig.ts` 中的配置，动态生成一个 3D 场景列表按钮。点击按钮后，会通过 `Unity3DScenePage.openFrom(...)` 加载对应 Unity 导出的 3D 场景。

`CommonUI.scene` 是统一的 3D 场景 UI 覆盖层，对应脚本是 `CommonUIScene.ts`。

进入任意 Unity 3D 场景后，都会打开 `CommonUI.scene`。它上面的返回按钮会统一调用 `Unity3DScenePage.backToStart()`，销毁当前 3D 场景并返回 `Start.scene`。

## Unity 导出资源路径

Unity 插件导出的原始资源先放在：

```text
Unity/project/Laya_Export/
```

同步到 Laya 项目后按资源类型放在：

```text
Laya/project/bin/Scene/   # 场景资源，主文件是 .ls
Laya/project/bin/Prefab/  # 预制体资源，主文件是 .lh
```

当前已经使用的 3D 场景路径示例：

```text
bin/Scene/LayaScene_First3DScene/Conventional/First3DScene.ls
bin/Scene/LayaScene_3DParticleScene/Conventional/3DParticleScene.ls
```

对应配置在：

```text
src/scenes/UnitySceneConfig.ts
```

新增一个 3D 场景后，需要在 `UnitySceneConfig.ts` 中补一项：

```ts
{
	id: "scene_id",
	title: "Scene Title",
	url: "Scene/LayaScene_xxx/Conventional/xxx.ls"
}
```

## 同步工具

同步脚本路径：

```text
Unity/project/Tools/sync_laya_export.py
```

运行方式：

```bash
python3 /Users/huangzhuofu/Documents/Projects/Laya_Unity_Demo/Unity/project/Tools/sync_laya_export.py
```

脚本会自动使用固定项目路径，不需要手动传导出目录。

同步规则：

- 读取 `Unity/project/Laya_Export/` 下的每个导出目录
- 如果导出目录的 `Conventional` 目录直属主文件是 `.ls`，放到 `Laya/project/bin/Scene/`
- 如果导出目录的 `Conventional` 目录直属主文件是 `.lh`，放到 `Laya/project/bin/Prefab/`
- 如果同一个导出目录同时出现 `.ls` 和 `.lh` 主文件，脚本会报错，避免分类错误
- 同步成功后，会删除 `Unity/project/Laya_Export/` 下对应的原导出目录
- `.DS_Store` 会被忽略

## 后续新增内容清单

新增 Laya 2D 场景时，一般需要补充：

- `laya/pages/xxx.scene`：在 Laya IDE 中创建或编辑的新场景
- `src/scenes/XxxScene.ts`：这个场景对应的逻辑脚本
- `.scene` 根节点的 `runtime`：填写脚本注册名，例如 `XxxScene`
- `src/Main.ts`：增加 `import XxxScene from "./scenes/XxxScene"`，并在 `registerSceneRuntimes()` 中调用 `Laya.ClassUtils.regClass("XxxScene", XxxScene)`
- 场景切换入口：在按钮点击、流程控制或其他场景脚本中调用 `Laya.Scene.open("xxx.scene")`

新增 Unity 3D 场景时，一般需要补充：

- Unity 中导出到 `Unity/project/Laya_Export/LayaScene_xxx/`
- 运行 `Unity/project/Tools/sync_laya_export.py`
- 确认资源进入 `Laya/project/bin/Scene/LayaScene_xxx/`
- `src/scenes/UnitySceneConfig.ts`：增加一条列表配置

示例：

```ts
{
	id: "new_scene",
	title: "New Scene",
	url: "Scene/LayaScene_NewScene/Conventional/NewScene.ls"
}
```

只要补进 `UnitySceneConfig.ts`，`StartScene.ts` 会自动把它显示成一个可点击按钮。

新增 Unity Prefab 时，一般需要补充：

- Unity 中导出到 `Unity/project/Laya_Export/LayaScene_xxx/`
- 运行 `Unity/project/Tools/sync_laya_export.py`
- 确认资源进入 `Laya/project/bin/Prefab/LayaScene_xxx/`
- 在需要使用它的业务脚本中通过 `.lh` 路径加载，例如 `Prefab/LayaScene_xxx/Conventional/xxx.lh`

Prefab 不是场景，不会自动出现在 `StartScene` 的场景列表里。它通常应该由某个场景脚本在运行时加载并挂到当前 `Scene3D` 下。

## 推荐新增流程

新增 Laya 2D 场景：

1. 在 Laya IDE 中创建 `.scene`
2. 给场景根节点设置 `runtime`
3. 在 `src/scenes/` 下创建对应 TS 脚本
4. 在 `src/Main.ts` 中用 `Laya.ClassUtils.regClass(...)` 注册

新增 Unity 3D 场景：

1. 从 Unity 导出到 `Unity/project/Laya_Export/`
2. 运行 `sync_laya_export.py`
3. 确认资源进入 `bin/Scene/`
4. 在 `src/scenes/UnitySceneConfig.ts` 中新增配置
5. 重新编译 Laya 项目
