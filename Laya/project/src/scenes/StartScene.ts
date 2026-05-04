import Unity3DScenePage from "./Unity3DScenePage";
import UnitySceneConfigs, { UnitySceneConfig } from "./UnitySceneConfig";

export default class StartScene extends Laya.Scene {
	private _templateButton: Laya.Button | null = null;
	private _sceneButtons: Laya.Button[] = [];
	private _tipBox: Laya.Sprite | null = null;
	private _isLoading3DScene = false;

	onOpened(_param: any): void {
		this._templateButton = this.getChildByName("btn_change_scene") as Laya.Button | null;
		if (!this._templateButton) {
			console.warn("Can not find button: btn_change_scene");
			return;
		}

		this.createUnitySceneButtons();
	}

	onClosed(_type?: string): void {
		for (const button of this._sceneButtons) {
			button.off(Laya.Event.CLICK, this, this.onUnitySceneButtonClick);
			button.destroy(true);
		}
		this._sceneButtons.length = 0;
		this._templateButton = null;

		Laya.timer.clear(this, this.hideTip);
		this.hideTip();
	}

	private createUnitySceneButtons(): void {
		if (!this._templateButton) return;

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

	private onUnitySceneButtonClick(sceneConfig: UnitySceneConfig): void {
		if (this._isLoading3DScene) return;

		this._isLoading3DScene = true;
		this.setSceneButtonsEnabled(false);

		const message = "Loading " + sceneConfig.title + "...";
		console.log(message);
		this.showTip(message);
		Unity3DScenePage.openFrom(this, sceneConfig);
	}

	private setSceneButtonsEnabled(enabled: boolean): void {
		for (const button of this._sceneButtons) {
			button.mouseEnabled = enabled;
		}
	}

	private showTip(message: string): void {
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

	private hideTip(): void {
		if (!this._tipBox) return;
		this._tipBox.removeSelf();
		this._tipBox.destroy(true);
		this._tipBox = null;
	}
}
