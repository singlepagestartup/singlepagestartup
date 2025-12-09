export function prepareFormDataToSend(params: { data: any }) {
  const { data } = params;

  const formData = new FormData();

  if (data) {
    formData.append("data", JSON.stringify(data));

    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (
        Array.isArray(value) &&
        value.every((v) => v instanceof File)
      ) {
        value.forEach((file: File) => {
          formData.append(key, file);
        });
      }
    });
  }

  return formData;
}
