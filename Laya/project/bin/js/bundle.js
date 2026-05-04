(function () {
    'use strict';

    class GameConfig {
        constructor() { }
        static init() {
            var reg = Laya.ClassUtils.regClass;
        }
    }
    GameConfig.width = 640;
    GameConfig.height = 1136;
    GameConfig.scaleMode = "showall";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "middle";
    GameConfig.alignH = "center";
    GameConfig.startScene = "Start.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class Unity3DScenePage {
        static openFrom(sourceScene, sceneConfig) {
            if (this._isLoading)
                return;
            this._isLoading = true;
            this._sourceScene = sourceScene;
            this._currentSceneConfig = sceneConfig;
            this.destroyScene3D();
            Laya.Scene3D.load(sceneConfig.url, Laya.Handler.create(this, this.onUnitySceneLoaded));
        }
        static backToStart() {
            this._isLoading = false;
            Laya.Scene.close(this.COMMON_UI_URL);
            this.destroyScene3D();
            this._sourceScene = null;
            this._currentSceneConfig = null;
            Laya.Scene.open(this.START_SCENE_URL);
        }
        static onUnitySceneLoaded(scene3D) {
            this._isLoading = false;
            const sceneConfig = this._currentSceneConfig;
            console.log("Unity scene loaded:", sceneConfig ? sceneConfig.title : scene3D.name);
            if (this._sourceScene) {
                this._sourceScene.close();
                this._sourceScene = null;
            }
            scene3D.name = sceneConfig ? sceneConfig.id : "Unity3DScene";
            this._scene3D = scene3D;
            Laya.stage.addChildAt(scene3D, 0);
            Laya.Scene.open(this.COMMON_UI_URL, false);
        }
        static destroyScene3D() {
            if (!this._scene3D)
                return;
            this._scene3D.removeSelf();
            this._scene3D.destroy(true);
            this._scene3D = null;
        }
    }
    Unity3DScenePage.COMMON_UI_URL = "CommonUI.scene";
    Unity3DScenePage.START_SCENE_URL = "Start.scene";
    Unity3DScenePage._scene3D = null;
    Unity3DScenePage._sourceScene = null;
    Unity3DScenePage._currentSceneConfig = null;
    Unity3DScenePage._isLoading = false;

    const UnitySceneConfigs = [
        {
            id: "first3d",
            title: "First 3D Scene",
            url: "Scene/LayaScene_First3DScene/Conventional/First3DScene.ls"
        },
        {
            id: "particle3d",
            title: "3D Particle Scene",
            url: "Scene/LayaScene_3DParticleScene/Conventional/3DParticleScene.ls"
        }
    ];

    class StartScene extends Laya.Scene {
        constructor() {
            super(...arguments);
            this._templateButton = null;
            this._sceneButtons = [];
            this._tipBox = null;
            this._isLoading3DScene = false;
        }
        onOpened(_param) {
            this._templateButton = this.getChildByName("btn_change_scene");
            if (!this._templateButton) {
                console.warn("Can not find button: btn_change_scene");
                return;
            }
            this.createUnitySceneButtons();
        }
        onClosed(_type) {
            for (const button of this._sceneButtons) {
                button.off(Laya.Event.CLICK, this, this.onUnitySceneButtonClick);
                button.destroy(true);
            }
            this._sceneButtons.length = 0;
            this._templateButton = null;
            Laya.timer.clear(this, this.hideTip);
            this.hideTip();
        }
        createUnitySceneButtons() {
            if (!this._templateButton)
                return;
            this._templateButton.visible = false;
            const x = this._templateButton.x;
            const y = this._templateButton.y;
            const width = this._templateButton.width || 256;
            const height = this._templateButton.height || 64;
            const gap = height + 18;
            const skin = this._templateButton.skin;
            UnitySceneConfigs.forEach((sceneConfig, index) => {
                const button = new Laya.Button(skin, sceneConfig.title);
                button.name = "btn_unity_scene_" + sceneConfig.id;
                button.pos(x, y + index * gap);
                button.size(width, height);
                button.labelSize = this._templateButton ? this._templateButton.labelSize : 20;
                button.on(Laya.Event.CLICK, this, this.onUnitySceneButtonClick, [sceneConfig]);
                this.addChild(button);
                this._sceneButtons.push(button);
            });
        }
        onUnitySceneButtonClick(sceneConfig) {
            if (this._isLoading3DScene)
                return;
            this._isLoading3DScene = true;
            this.setSceneButtonsEnabled(false);
            const message = "Loading " + sceneConfig.title + "...";
            console.log(message);
            this.showTip(message);
            Unity3DScenePage.openFrom(this, sceneConfig);
        }
        setSceneButtonsEnabled(enabled) {
            for (const button of this._sceneButtons) {
                button.mouseEnabled = enabled;
            }
        }
        showTip(message) {
            this.hideTip();
            const width = 460;
            const height = 88;
            const box = new Laya.Sprite();
            box.mouseEnabled = false;
            box.x = (this.width - width) * 0.5;
            box.y = (this.height - height) * 0.5;
            const bg = new Laya.Sprite();
            bg.graphics.drawRect(0, 0, width, height, "#000000");
            bg.alpha = 0.8;
            box.addChild(bg);
            const text = new Laya.Text();
            text.text = message;
            text.color = "#ffffff";
            text.fontSize = 32;
            text.align = "center";
            text.valign = "middle";
            text.width = width;
            text.height = height;
            box.addChild(text);
            this._tipBox = box;
            this.addChild(box);
            Laya.timer.once(1200, this, this.hideTip);
        }
        hideTip() {
            if (!this._tipBox)
                return;
            this._tipBox.removeSelf();
            this._tipBox.destroy(true);
            this._tipBox = null;
        }
    }

    class CommonUIScene extends Laya.Scene {
        constructor() {
            super(...arguments);
            this._returnButton = null;
        }
        onOpened(_param) {
            this._returnButton = this.getChildByName("btn_return");
            if (!this._returnButton) {
                console.warn("Can not find button: btn_return");
                return;
            }
            this._returnButton.on(Laya.Event.CLICK, this, this.onReturnButtonClick);
        }
        onClosed(_type) {
            if (!this._returnButton)
                return;
            this._returnButton.off(Laya.Event.CLICK, this, this.onReturnButtonClick);
            this._returnButton = null;
        }
        onReturnButtonClick() {
            Unity3DScenePage.backToStart();
        }
    }

    class Main {
        constructor() {
            Config.useRetinalCanvas = true;
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            this.registerSceneRuntimes();
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError(true);
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        registerSceneRuntimes() {
            Laya.ClassUtils.regClass("StartScene", StartScene);
            Laya.ClassUtils.regClass("CommonUIScene", CommonUIScene);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
        }
    }
    new Main();

}());
