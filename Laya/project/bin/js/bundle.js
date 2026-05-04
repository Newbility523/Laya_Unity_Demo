(function () {
	'use strict';

	class StartScene extends Laya.Scene {
	    constructor() {
	        super(...arguments);
	        this._changeSceneButton = null;
	        this._tipBox = null;
	    }
	    onOpened(_param) {
	        this._changeSceneButton = this.getChildByName("btn_change_scene");
	        if (!this._changeSceneButton) {
	            console.warn("Can not find button: btn_change_scene");
	            return;
	        }
	        this._changeSceneButton.on(Laya.Event.CLICK, this, this.onChangeSceneButtonClick);
	    }
	    onClosed(_type) {
	        if (this._changeSceneButton) {
	            this._changeSceneButton.off(Laya.Event.CLICK, this, this.onChangeSceneButtonClick);
	            this._changeSceneButton = null;
	        }
	        Laya.timer.clear(this, this.hideTip);
	        this.hideTip();
	    }
	    onChangeSceneButtonClick() {
	        const message = "StartScene button clicked";
	        console.log(message);
	        this.showTip(message);
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

	class GameConfig {
	    constructor() { }
	    static init() {
	        var reg = Laya.ClassUtils.regClass;
	        reg("StartScene", StartScene);
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
	        if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
	            Laya.enableDebugPanel();
	        if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
	            Laya["PhysicsDebugDraw"].enable();
	        if (GameConfig.stat)
	            Laya.Stat.show();
	        Laya.alertGlobalError(true);
	        Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
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
