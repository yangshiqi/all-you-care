---
name: Image Remix and Optimize
description: Generates new images based on existing ones in a source directory, then converts and optimizes them to JPG Format (<600KB) in a destination directory, naming them sequentially (0.jpg, 1.jpg...).
---

# Image Remix and Optimize

Use this skill to batch process images: generating variations (remixes) and optimizing them for web use.

## Parameters

- `source_dir`: Directory containing the original images.
- `dest_dir`: Directory to save the new, optimized images.
- `prompt`: (Optional) The text prompt to use for generation. If not provided, you must ask the user or derive it.

## Instructions

1.  **Validate Directories**:
    - Check if `source_dir` exists.
    - Ensure `dest_dir` exists or create it.

2.  **List Images**:
    - Use `list_dir` to find all image files (png, jpg, jpeg) in `source_dir`.
    - Sort the list of files to ensure deterministic processing order.

3.  **Process Each Image**:
    - Initialize a counter `i = 0`.
    - Loop through each image file found:
      - **Generate**: Call the `generate_image` tool.
        - `ImagePaths`: [`<absolute_path_to_source_image>`]
        - `Prompt`: Use the provided `prompt`. If no prompt was provided, use the filename to infer a simple prompt or default to "A creative variation of this image".
        - `ImageName`: use the source filename stem + "_remix_" + i (e.g., `image_remix_0`).
      - **Identify Output**: The `generate_image` tool returns a path to the generated artifact (e.g., in `.gemini/...`). Note this path.
      - **Optimize & Move**: Run the optimization script to convert to JPG and save to `dest_dir` using the counter for the filename.
        - Destination Path: `<dest_dir>/<i.jpg>` (e.g., `.../0.jpg`, `.../1.jpg`).
        - Command: `python3 .agent/skills/image_remix_and_optimize/scripts/optimize_image.py "<artifact_path>" "<dest_dir>/<i.jpg>" --max_size 600`
        - _Note_: Ensure you use absolute paths.
      - **Increment Counter**: `i += 1`.

## Example Usage

If the user says: "Remix images in @[public/old] to @[public/new] using the prompt 'cyberpunk style'", you would:

1.  List files in `/abs/path/to/public/old`.
2.  Initialize `i=0`.
3.  For `file1.png`:
    - `generate_image(Prompt="cyberpunk style", ImagePaths=["/abs/path/to/public/old/file1.png"], ImageName="remix_0")`
    - (Assume output is `.../remix_0.png`)
    - `run_command("python3 .agent/skills/image_remix_and_optimize/scripts/optimize_image.py '.../remix_0.png' '/abs/path/to/public/new/0.jpg'")`
    - `i` becomes 1.
4.  For `file2.png`:
    - `generate_image(...)`
    - `run_command("python3 ... '.../1.jpg'")`
    - `i` becomes 2.

## Requirements

- Python 3 with `Pillow` installed (`pip install Pillow`).
