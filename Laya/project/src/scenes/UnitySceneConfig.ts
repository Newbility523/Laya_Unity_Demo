export interface UnitySceneConfig {
	id: string;
	title: string;
	url: string;
}

const UnitySceneConfigs: UnitySceneConfig[] = [
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

export default UnitySceneConfigs;
