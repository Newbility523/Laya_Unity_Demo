import { UnitySceneConfig } from "./UnitySceneConfig";

export default class Unity3DScenePage {
	private static readonly COMMON_UI_URL = "CommonUI.scene";
	private static readonly START_SCENE_URL = "Start.scene";

	private static _scene3D: Laya.Scene3D | null = null;
	private static _sourceScene: Laya.Scene | null = null;
	private static _currentSceneConfig: UnitySceneConfig | null = null;
	private static _isLoading = false;

	static openFrom(sourceScene: Laya.Scene, sceneConfig: UnitySceneConfig): void {
		if (this._isLoading) return;

		this._isLoading = true;
		this._sourceScene = sourceScene;
		this._currentSceneConfig = sceneConfig;
		this.destroyScene3D();
		Laya.Scene3D.load(sceneConfig.url, Laya.Handler.create(this, this.onUnitySceneLoaded));
	}

	static backToStart(): void {
		this._isLoading = false;
		Laya.Scene.close(this.COMMON_UI_URL);
		this.destroyScene3D();
		this._sourceScene = null;
		this._currentSceneConfig = null;
		Laya.Scene.open(this.START_SCENE_URL);
	}

	private static onUnitySceneLoaded(scene3D: Laya.Scene3D): void {
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

	private static destroyScene3D(): void {
		if (!this._scene3D) return;
		this._scene3D.removeSelf();
		this._scene3D.destroy(true);
		this._scene3D = null;
	}
}
