using System;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class LayaPrefabExportMenu
{
    private const string MenuPath = "Assets/导出prefab";
    private const string TempSceneDirectory = "Assets/__LayaPrefabExportTemp";

    [MenuItem(MenuPath, true)]
    private static bool ValidateExportPrefab()
    {
        return GetSelectedPrefabAsset() != null;
    }

    [MenuItem(MenuPath)]
    private static void ExportPrefab()
    {
        GameObject prefab = GetSelectedPrefabAsset();
        if (prefab == null)
        {
            EditorUtility.DisplayDialog("导出prefab", "请选择一个 prefab 资源。", "确定");
            return;
        }

        Type layaAir3DType = FindType("LayaAir3D");
        if (layaAir3DType == null)
        {
            EditorUtility.DisplayDialog("导出prefab", "找不到 LayaAir3D 导出器，请确认 LayaAir3D 插件已导入。", "确定");
            return;
        }

        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
            return;

        SceneSetup[] previousSceneSetup = EditorSceneManager.GetSceneManagerSetup();
        string tempScenePath = CreateTempScenePath(prefab.name);
        bool createdTempDirectory = false;

        try
        {
            createdTempDirectory = EnsureTempDirectory();

            Scene tempScene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject instance = PrefabUtility.InstantiatePrefab(prefab, tempScene) as GameObject;
            if (instance == null)
                instance = UnityEngine.Object.Instantiate(prefab);

            instance.name = prefab.name;
            instance.transform.SetPositionAndRotation(Vector3.zero, Quaternion.identity);
            instance.transform.localScale = Vector3.one;
            SceneManager.MoveGameObjectToScene(instance, tempScene);

            EditorSceneManager.SaveScene(tempScene, tempScenePath);
            AssetDatabase.Refresh();

            ConfigureLayaForSprite3DExport(layaAir3DType);
            InvokeStatic(layaAir3DType, "ExportResources");
        }
        catch (Exception exception)
        {
            Debug.LogException(exception);
            EditorUtility.DisplayDialog("导出prefab", "导出失败，详细信息请查看 Console。", "确定");
        }
        finally
        {
            RestorePreviousScenes(previousSceneSetup);
            DeleteTempScene(tempScenePath, createdTempDirectory);
        }
    }

    private static GameObject GetSelectedPrefabAsset()
    {
        GameObject selected = Selection.activeObject as GameObject;
        if (selected == null)
            return null;

        string assetPath = AssetDatabase.GetAssetPath(selected);
        if (string.IsNullOrEmpty(assetPath) || !assetPath.EndsWith(".prefab", StringComparison.OrdinalIgnoreCase))
            return null;

        return AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
    }

    private static void ConfigureLayaForSprite3DExport(Type layaAir3DType)
    {
        InvokeStatic(layaAir3DType, "ReadExportConfig");

        SetStaticField(layaAir3DType, "Scenes", false);
        SetStaticField(layaAir3DType, "Conventional", true);
        SetStaticField(layaAir3DType, "Android", false);
        SetStaticField(layaAir3DType, "Ios", false);

        // The obfuscated exporter stores the Scene/Sprite3D tab in this private field.
        // In the bundled plugin, 1 is Sprite3D / 预设.
        SetStaticField(layaAir3DType, "g", 1);
    }

    private static void InvokeStatic(Type type, string methodName)
    {
        MethodInfo method = type.GetMethod(methodName, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static);
        if (method == null)
            throw new MissingMethodException(type.FullName, methodName);

        method.Invoke(null, null);
    }

    private static void SetStaticField(Type type, string fieldName, object value)
    {
        FieldInfo field = type.GetField(fieldName, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static);
        if (field == null)
            return;

        field.SetValue(null, value);
    }

    private static Type FindType(string typeName)
    {
        foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            Type type = assembly.GetType(typeName);
            if (type != null)
                return type;
        }

        return null;
    }

    private static bool EnsureTempDirectory()
    {
        if (AssetDatabase.IsValidFolder(TempSceneDirectory))
            return false;

        AssetDatabase.CreateFolder("Assets", "__LayaPrefabExportTemp");
        return true;
    }

    private static string CreateTempScenePath(string prefabName)
    {
        string safeName = string.IsNullOrEmpty(prefabName) ? "Prefab" : prefabName;
        foreach (char invalidChar in System.IO.Path.GetInvalidFileNameChars())
            safeName = safeName.Replace(invalidChar, '_');

        return TempSceneDirectory + "/" + safeName + ".unity";
    }

    private static void RestorePreviousScenes(SceneSetup[] previousSceneSetup)
    {
        if (previousSceneSetup == null || previousSceneSetup.Length == 0)
            return;

        EditorSceneManager.RestoreSceneManagerSetup(previousSceneSetup);
    }

    private static void DeleteTempScene(string tempScenePath, bool deleteTempDirectory)
    {
        if (!string.IsNullOrEmpty(tempScenePath))
            AssetDatabase.DeleteAsset(tempScenePath);

        if (deleteTempDirectory)
            AssetDatabase.DeleteAsset(TempSceneDirectory);

        AssetDatabase.Refresh();
    }
}
