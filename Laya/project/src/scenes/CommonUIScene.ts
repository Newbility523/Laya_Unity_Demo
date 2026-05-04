import Unity3DScenePage from "./Unity3DScenePage";

export default class CommonUIScene extends Laya.Scene {
	private _returnButton: Laya.Button | null = null;

	onOpened(_param: any): void {
		this._returnButton = this.getChildByName("btn_return") as Laya.Button | null;
		if (!this._returnButton) {
			console.warn("Can not find button: btn_return");
			return;
		}

		this._returnButton.on(Laya.Event.CLICK, this, this.onReturnButtonClick);
	}

	onClosed(_type?: string): void {
		if (!this._returnButton) return;
		this._returnButton.off(Laya.Event.CLICK, this, this.onReturnButtonClick);
		this._returnButton = null;
	}

	private onReturnButtonClick(): void {
		Unity3DScenePage.backToStart();
	}
}
