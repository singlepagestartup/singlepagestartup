export async function util(props: {
  files: {
    title: string;
    extension: string;
    url: string;
    type: string;
  }[];
}): Promise<File[]> {
  const filePromises = props.files.map(async (file) => {
    const response = await fetch(file.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch attachment from ${file.url}`);
    }

    const blob = await response.blob();

    return new File([blob], `${file.title}.${file.extension}`, {
      type: file.type,
    });
  });

  return Promise.all(filePromises);
}
