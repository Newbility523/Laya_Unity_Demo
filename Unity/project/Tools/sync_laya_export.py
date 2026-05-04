#!/usr/bin/env python3
from __future__ import annotations

import shutil
import sys
from pathlib import Path


UNITY_PROJECT_DIR = Path(__file__).resolve().parents[1]
DEMO_ROOT_DIR = UNITY_PROJECT_DIR.parent.parent
EXPORT_ROOT_DIR = UNITY_PROJECT_DIR / "Laya_Export"
LAYA_BIN_DIR = DEMO_ROOT_DIR / "Laya" / "project" / "bin"
SCENE_OUTPUT_DIR = LAYA_BIN_DIR / "Scene"
PREFAB_OUTPUT_DIR = LAYA_BIN_DIR / "Prefab"

IGNORED_FILE_NAMES = {".DS_Store"}
RESOURCE_SUFFIXES = {".ls", ".lh"}


def iter_export_dirs() -> list[Path]:
	if not EXPORT_ROOT_DIR.exists():
		raise FileNotFoundError(f"Laya export directory does not exist: {EXPORT_ROOT_DIR}")

	return sorted(path for path in EXPORT_ROOT_DIR.iterdir() if path.is_dir())


def has_file_with_suffix(root: Path, suffix: str) -> bool:
	return any(path.is_file() and path.suffix == suffix for path in root.rglob("*"))


def get_primary_suffixes(export_dir: Path) -> set[str]:
	conventional_dir = export_dir / "Conventional"
	if not conventional_dir.exists():
		return set()

	return {
		path.suffix
		for path in conventional_dir.iterdir()
		if path.is_file() and path.suffix in RESOURCE_SUFFIXES
	}


def get_output_root(export_dir: Path) -> Path:
	primary_suffixes = get_primary_suffixes(export_dir)
	if primary_suffixes:
		has_scene = ".ls" in primary_suffixes
		has_prefab = ".lh" in primary_suffixes
	else:
		has_scene = has_file_with_suffix(export_dir, ".ls")
		has_prefab = has_file_with_suffix(export_dir, ".lh")

	if has_scene and has_prefab:
		raise ValueError(f"Export directory contains both .ls and .lh files: {export_dir}")
	if has_scene:
		return SCENE_OUTPUT_DIR
	if has_prefab:
		return PREFAB_OUTPUT_DIR

	raise ValueError(f"Export directory does not contain .ls or .lh files: {export_dir}")


def remove_ignored_files(root: Path) -> None:
	for path in root.rglob("*"):
		if path.is_file() and path.name in IGNORED_FILE_NAMES:
			path.unlink()


def sync_export_dir(export_dir: Path) -> Path:
	output_root = get_output_root(export_dir)
	output_root.mkdir(parents=True, exist_ok=True)

	target_dir = output_root / export_dir.name
	temp_dir = output_root / f".{export_dir.name}.tmp"

	if temp_dir.exists():
		shutil.rmtree(temp_dir)

	shutil.copytree(
		export_dir,
		temp_dir,
		ignore=shutil.ignore_patterns(*IGNORED_FILE_NAMES),
	)

	if target_dir.exists():
		shutil.rmtree(target_dir)

	temp_dir.rename(target_dir)
	shutil.rmtree(export_dir)
	return target_dir


def clean_export_root() -> None:
	if not EXPORT_ROOT_DIR.exists():
		return

	for path in EXPORT_ROOT_DIR.iterdir():
		if path.is_file() and path.name in IGNORED_FILE_NAMES:
			path.unlink()


def main() -> int:
	SCENE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
	PREFAB_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

	export_dirs = iter_export_dirs()
	if not export_dirs:
		print(f"No Laya export directories found: {EXPORT_ROOT_DIR}")
		return 0

	for export_dir in export_dirs:
		remove_ignored_files(export_dir)
		target_dir = sync_export_dir(export_dir)
		print(f"Synced {export_dir.name} -> {target_dir}")

	clean_export_root()
	return 0


if __name__ == "__main__":
	try:
		raise SystemExit(main())
	except Exception as exc:
		print(f"Sync failed: {exc}", file=sys.stderr)
		raise SystemExit(1)
