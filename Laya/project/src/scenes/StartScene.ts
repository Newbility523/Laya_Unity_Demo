export default class StartScene extends Laya.Scene {
	private _changeSceneButton: Laya.Button | null = null;
	private _tipBox: Laya.Sprite | null = null;

	onOpened(_param: any): void {
		this._changeSceneButton = this.getChildByName("btn_change_scene") as Laya.Button | null;
		if (!this._changeSceneButton) {
			console.warn("Can not find button: btn_change_scene");
			return;
		}

		this._changeSceneButton.on(Laya.Event.CLICK, this, this.onChangeSceneButtonClick);
	}

	onClosed(_type?: string): void {
		if (this._changeSceneButton) {
			this._changeSceneButton.off(Laya.Event.CLICK, this, this.onChangeSceneButtonClick);
			this._changeSceneButton = null;
		}

		Laya.timer.clear(this, this.hideTip);
		this.hideTip();
	}

	private onChangeSceneButtonClick(): void {
		const message = "StartScene button clicked";
		console.log(message);
		this.showTip(message);
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
