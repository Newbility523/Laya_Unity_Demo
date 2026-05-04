// v1.8.2
const ideModuleDir = global.ideModuleDir;
const workSpaceDir = global.workSpaceDir;

//引用插件模块
const gulp = require(ideModuleDir + "gulp");
const fs = require("fs");
const path = require("path");
const revCollector = require(ideModuleDir + 'gulp-rev-collector');

let copyLibsTask = ["copyPlatformLibsJsFile"];
let versiontask = ["version2"];

let
	config,
	releaseDir;
let versionCon; // 版本管理version.json
let commandSuffix,
	layarepublicPath;

gulp.task("preCreate_Alipay", copyLibsTask, function () {
	releaseDir = global.releaseDir;
	config = global.config;
	commandSuffix = global.commandSuffix;
	layarepublicPath = global.layarepublicPath;
});

gulp.task("copyPlatformFile_Alipay", ["preCreate_Alipay"], function () {
	let adapterPath = path.join(layarepublicPath, "LayaAirProjectPack", "lib", "data", "Alipayfiles");
	let hasPublishPlatform =
		fs.existsSync(path.join(releaseDir, "game.js")) &&
		fs.existsSync(path.join(releaseDir, "game.json")) &&
		fs.existsSync(path.join(releaseDir, "project.config.json"));
	let copyLibsList;
	if (hasPublishPlatform) {
		copyLibsList = [`${adapterPath}/my-adapter.js`];
	} else {
		copyLibsList = [`${adapterPath}/*.*`];
	}
	var stream = gulp.src(copyLibsList);
	return stream.pipe(gulp.dest(releaseDir));
});

gulp.task("modifyFile_Alipay", versiontask, function () {
	// 修改game.json文件
	let gameJsonPath = path.join(releaseDir, "game.json");
	let content = fs.readFileSync(gameJsonPath, "utf8");
	let conJson = JSON.parse(content);
	conJson.screenOrientation = config.AlipayInfo.orientation;

	if (config.AlipayInfo.subpack) {
		conJson.subpackages = config.alipaySubpack;
	} else {
		delete conJson.subpackages;
	}

	content = JSON.stringify(conJson, null, 4);
	fs.writeFileSync(gameJsonPath, content, "utf8");

	// 修改game.js
	let filePath = path.join(releaseDir, "game.js");
	let fileContent = fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8");
	let reWriteMainJs = !fs.existsSync(filePath) || !fileContent.includes("Alipaymini");
	if (reWriteMainJs) {
		fileContent = `require("./my-adapter.js");
require("./libs/laya.Alipaymini.js");\nrequire("./index.js");`;
		fs.writeFileSync(filePath, fileContent, "utf8");
	}

	if (config.version || config.enableVersion) {
		let versionPath = releaseDir + "/version.json";
		versionCon = fs.readFileSync(versionPath, "utf8");
		versionCon = JSON.parse(versionCon);
	}
	// 修改index.js
	let indexJsStr = (versionCon && versionCon["index.js"]) ? versionCon["index.js"] : "index.js";
	let indexFilePath = path.join(releaseDir, indexJsStr);
	if (!fs.existsSync(indexFilePath)) {
		return;
	}
	let indexFileContent = fs.readFileSync(indexFilePath, "utf8");
	indexFileContent = indexFileContent.replace(/loadLib(\(['"])/gm, "require$1./");
	if (config.useWASM) {
		let wasmList = [];
		let jsList = [];
		let insertIndex = -1;
		function checkWasm(cwasmStr) {
			//找到indexFileContent中是否有.wasm.的文件
			if (indexFileContent.includes(cwasmStr)) {
				//找到所有的.wasm.的文件
				let findIndex = 0;
				while (true) {
					findIndex = indexFileContent.indexOf(cwasmStr, findIndex);
					if (findIndex !== -1) {
						//提取这一行的数据，要从这一行的开头获取，到下一行的开头，并不是从findIndex位置开始，并且把这一行数据从原始数据充删除
						const endIndex = indexFileContent.indexOf("\n", findIndex);
						const startIndex = indexFileContent.lastIndexOf("\n", findIndex);
						if (startIndex < insertIndex || -1 === insertIndex) {
							insertIndex = startIndex;
						}
						const wasmStr = indexFileContent.substring(startIndex + 1, endIndex);
						const findIndex2 = wasmStr.indexOf(cwasmStr);
						const findEndIndex = wasmStr.indexOf(".", findIndex2 + 1);
						const replaceStr = wasmStr.substring(findIndex2, findEndIndex);

						const jsStr = wasmStr.replace(replaceStr, "");
						const findJsIndex = indexFileContent.indexOf(jsStr);
						if (0 <= findJsIndex) {
							if (findJsIndex < insertIndex) {
								insertIndex = findJsIndex;
							}
							jsList.push(jsStr);
							indexFileContent = indexFileContent.replace(jsStr, "");
						}
						wasmList.push(wasmStr);
						indexFileContent = indexFileContent.replace(wasmStr, "");
						findIndex = 0;
					} else {
						break;
					}
				}
			}
		}
		checkWasm(".wasm");

		if (wasmList.length > 0) {
			const insertStr = "\nif(!window.MYWebAssembly){\n" +
				jsList.join("\n") +
				"\n}else{\n" +
				wasmList.join("\n") +
				"\n}";
			indexFileContent = indexFileContent.substring(0, insertIndex) + insertStr + indexFileContent.substring(insertIndex);
		}
	}
	fs.writeFileSync(indexFilePath, indexFileContent, "utf8");
})

gulp.task("modifyMinJs_Alipay", ["modifyFile_Alipay"], function () {
	// 如果保留了平台文件，如果同时取消使用min类库，就会出现文件引用不正确的问题
	if (config.keepPlatformFile) {
		let fileJsPath = path.join(releaseDir, "game.js");
		let content = fs.readFileSync(fileJsPath, "utf-8");
		content = content.replace(/min\/laya(-[\w\d]+)?\.Alipaymini\.min\.js/gm, "laya.Alipaymini.js");
		fs.writeFileSync(fileJsPath, content, 'utf-8');
	}
	if (!config.useMinJsLibs) {
		return;
	}
	let fileJsPath = path.join(releaseDir, "game.js");
	let content = fs.readFileSync(fileJsPath, "utf-8");
	content = content.replace(/(min\/)?laya(-[\w\d]+)?\.Alipaymini(\.min)?\.js/gm, "min/laya.Alipaymini.min.js");
	fs.writeFileSync(fileJsPath, content, 'utf-8');
});

gulp.task("version_Alipay", ["modifyMinJs_Alipay"], function () {
	// 如果保留了平台文件，如果同时开启版本管理，就会出现文件引用不正确的问题
	if (config.keepPlatformFile) {
		let fileJsPath = path.join(releaseDir, "game.js");
		let content = fs.readFileSync(fileJsPath, "utf-8");
		content = content.replace(/laya(-[\w\d]+)?\.Alipaymini/gm, "laya.Alipaymini");
		content = content.replace(/index(-[\w\d]+)?\.js/gm, "index.js");
		fs.writeFileSync(fileJsPath, content, 'utf-8');
	}
	if (config.version) {
		let versionPath = releaseDir + "/version.json";
		let gameJSPath = releaseDir + "/game.js";
		let srcList = [versionPath, gameJSPath];
		return gulp.src(srcList)
			.pipe(revCollector())
			.pipe(gulp.dest(releaseDir));
	}
});

gulp.task("buildAlipayProj", ["version_Alipay"], function () {
	console.log("all tasks completed");
});