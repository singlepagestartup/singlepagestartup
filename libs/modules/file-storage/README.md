# File Storage Module

## 1. Purpose of the Module

The File Storage module manages uploaded media and file metadata. It provides models for files and widgets that render groups of files.

### It solves the following tasks:

- Stores file metadata and paths.
- Renders images and videos in frontend components.
- Groups files into widgets for reuse.
- Attaches files to other modules through relations.

### Typical use cases:

- Uploading images and videos for content blocks.
- Displaying media galleries or logo strips.
- Associating files with products or articles.

---

## 2. Models

| Model                               | Purpose                             |
| ----------------------------------- | ----------------------------------- |
| [file](./models/file/README.md)     | Uploaded media and metadata         |
| [widget](./models/widget/README.md) | File collections and display groups |

---

## 3. Relations

| Relation                                                   | Purpose               |
| ---------------------------------------------------------- | --------------------- |
| [widgets-to-files](./relations/widgets-to-files/README.md) | Link widgets to files |

---
